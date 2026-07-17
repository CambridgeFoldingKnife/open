# 开馆助手报价规则

## 价格层级

1. `catalog_price`：画册公开标价，仅用于展示与差异比较。
2. `historical_price`：历史项目报价，记录客户、日期、规格和来源。
3. `approved_price`：管理员确认的当前标准对外报价，自动报价唯一可用价格。
4. `floor_price`：最低审批价；低于该价格必须由管理员审批。

## 自动报价规则

- 产品、规格和 `variant_id` 必须同时匹配。
- `price_status=approved` 才能进入自动总价。
- `inquiry` 显示“需要询价”；`conflict` 显示“价格冲突待审核”。
- 所有小计按 `数量 × 标准报价` 计算；折扣、运费、安装和培训单独列示。
- 报价修改创建新版本，不覆盖历史版本。
- 价格需记录来源、审核人、审核时间和有效期。
- AI只能解释推荐理由，不得生成或补全价格。

## 三档方案

- 基础版：只包含 `essential`。
- 标准版：包含 `essential + recommended`。
- 升级版：包含 `essential + recommended + upgrade`。
- `defer` 项不进入总价，仅作为后续采购建议。
