-- Remove the redundant "AGREEMENT" signature block from the default template body.
-- The PDF generator adds its own two-column signature section, so the inline
-- placeholder lines (Photographer/Client/Date) are no longer needed.
UPDATE contract_templates
SET body = RTRIM(
             SUBSTRING(body FROM 1 FOR STRPOS(body, E'\nAGREEMENT') - 1),
             E'\n━ '
           ),
    updated_at = NOW()
WHERE is_default = true
  AND STRPOS(body, E'\nAGREEMENT') > 0;
