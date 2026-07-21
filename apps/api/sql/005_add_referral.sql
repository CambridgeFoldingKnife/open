-- 顾问推荐码与客户来源顾问关联

-- 1. 给 staff_accounts 增加推荐码列
ALTER TABLE staff_accounts ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- 2. 为现有顾问生成推荐码（基于 id 生成 8 位小写编码）
UPDATE staff_accounts
SET referral_code = lower(substring(md5(id) for 8))
WHERE referral_code IS NULL AND role = 'consultant';

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_staff_accounts_referral ON staff_accounts(referral_code);
