# ChatGenius.pro

Modern static portfolio for ChatGenius.pro with live app screenshots and links.

## Deploy notes

- Serve the repository root as the web root.
- `api/chat_api.php` expects `OPENAI_API_KEY` to be configured in the hosting environment.
- Do not commit real API keys.

## Service sync

- Add or update public offers in `data/services.json`.
- RealtyFlow reads `https://www.chatgenius.pro/data/services.json` and can sync the offers into its ChatGenius service catalog for campaigns, Stripe setup, budgeting and business overview.
