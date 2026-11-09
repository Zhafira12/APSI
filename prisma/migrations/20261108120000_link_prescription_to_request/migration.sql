-- Link an uploaded prescription to the medicine request submitted in the same customer action.
-- The nullable column preserves every existing prescription row.
ALTER TABLE "resep_obat"
ADD COLUMN "permintaan_obat_id_permintaan" INTEGER;

CREATE UNIQUE INDEX "resep_obat_permintaan_obat_id_permintaan_key"
ON "resep_obat"("permintaan_obat_id_permintaan");

ALTER TABLE "resep_obat"
ADD CONSTRAINT "fk_resep_permintaan"
FOREIGN KEY ("permintaan_obat_id_permintaan")
REFERENCES "permintaan_obat"("id_permintaan")
ON DELETE SET NULL
ON UPDATE CASCADE;
