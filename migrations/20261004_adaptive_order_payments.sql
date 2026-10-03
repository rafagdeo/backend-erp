UPDATE pedidos p
LEFT JOIN (
  SELECT pedido_id, ROUND(SUM(quantidade * preco_unitario - COALESCE(desconto, 0)), 2) AS total
  FROM pedido_itens
  GROUP BY pedido_id
) totals ON totals.pedido_id = p.id
SET p.valor_pago = CASE
      WHEN p.status IN ('concluido', 'pago') THEN COALESCE(totals.total, 0)
      WHEN COALESCE(p.valor_pago, 0) > 0 THEN p.valor_pago
      ELSE ROUND(
        COALESCE(totals.total, 0) *
        LEAST(GREATEST(COALESCE(p.parcelas_pagas, 0), 0), GREATEST(COALESCE(p.parcelas, 1), 1)) /
        GREATEST(COALESCE(p.parcelas, 1), 1),
        2
      )
    END,
    p.parcelas_pagas = CASE
      WHEN p.status IN ('concluido', 'pago') THEN GREATEST(COALESCE(p.parcelas, 1), 1)
      ELSE COALESCE(p.parcelas_pagas, 0)
    END,
    p.status = CASE
      WHEN p.status = 'pendente' THEN 'processando'
      WHEN p.status = 'concluido' THEN 'pago'
      ELSE p.status
    END
WHERE p.status IN ('concluido', 'pago', 'pendente')
   OR (p.valor_pago = 0 AND p.parcelas_pagas > 0);
