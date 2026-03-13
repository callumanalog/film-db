-- For B&W stocks, the saturation column is used as "Color Sensitivity" (1=Orthochromatic, 3=Panchromatic, 5=Extended Panchromatic).
-- Set Color Sensitivity to 3 (Panchromatic) for these five stocks.
UPDATE film_stocks
SET saturation = 3
WHERE slug IN (
  'kodak-tmax-400',
  'kodak-tmax-100',
  'kodak-tri-x-400',
  'kodak-tmax-p3200',
  'kodak-double-x'
);
