ALTER TABLE laws
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(title, '') || ' ' ||
      coalesce(subject, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(number, '') || ' ' ||
      coalesce(long_description, '')
    )
  ) STORED;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS laws_search_tsv_idx ON laws USING GIN (search_tsv);
--> statement-breakpoint
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(text, '') || ' ' ||
      coalesce(number, '') || ' ' ||
      coalesce(title, '')
    )
  ) STORED;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS articles_search_tsv_idx ON articles USING GIN (search_tsv);
