# Configuration Guide

Copy `config/application-platform.example.yml` to the deployment configuration directory as `application.yml`, then replace every `REPLACE_WITH_...` value.

Required platform values:

- Center host and port
- Application ID assigned by the center platform
- Unique server ID for this deployment
- Public homepage registered in the center platform
- Shopify marketing backend URL and allowed backend hosts
- Writable customer import temporary directory

Every deployment must use a unique server ID. Do not reuse development or production IDs from another installation.

The configuration file must not be committed after real addresses or IDs have been filled in.
