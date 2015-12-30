# route53-dns-updater
Dyndns replacement

To use do this:

crontab -e
```
*/5 * * * *  /path/to/route53-dns-updater.js --access-key-id "<access-key-id>" --secret-access-key '<secret-access-key>' --domain-name <domain-name> 2>&1 | /usr/bin/logger -t route53-dns-updater
```

Or start it with systemd (see templates) or whatever you want.
