# Deployment Guide

## Directory layout

```text
INSTALL_DIR/
├── app/shopify-marketing-web.war
├── config/application.yml
├── config/application.env
└── logs/
```

Run the process with `INSTALL_DIR/config` as its working directory. The legacy platform configuration utility reads `application.yml` from the classpath or current working directory.

## Manual start

```bash
cd INSTALL_DIR/config
java -Xms128m -Xmx768m -jar ../app/shopify-marketing-web.war \
  --spring.config.additional-location=file:./application.yml
```

## Service installation

Copy `deployment/shopify-marketing-web.service.template`, replace all placeholders, validate the configuration, and install it through the operating system service manager.

After startup, verify `/health`, the center connection state, login, store selection, page navigation, and a read-only business query before enabling traffic.
