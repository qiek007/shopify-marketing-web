# Shopify Marketing Web

独立部署的 Shopify 营销页面与 BFF。项目包含 JSP、CSS、JavaScript、页面 Controller 和中心 RPC 适配，输出可执行 WAR；不连接业务 MySQL/Doris，也不运行营销后台 Worker。

## 第三方维护模式

本仓库是只读上游。第三方应将代码同步到自己的仓库维护，不会获得本仓库写权限。同步方法见 [docs/UPSTREAM.md](docs/UPSTREAM.md)。

## 构建要求

- Java 17
- Apache Maven 3.9.16
- 可访问 Maven Central
- 单独交付的私有 Maven 依赖包

解压私有依赖包后执行：

```bash
mvn -Dmaven.repo.local=../maven-repository clean test package
```

生成文件：`target/shopify-marketing-web.war`。完整说明见 [docs/BUILD.md](docs/BUILD.md)。

## 页面目录

- `src/main/resources/META-INF/resources/WEB-INF/shopify`：classic 主题
- `src/main/resources/META-INF/resources/WEB-INF/shopify-theme2`：theme2 主题
- `src/main/resources/META-INF/resources/shopify`：共享静态资源
- `src/main/resources/META-INF/resources/shopify-theme2`：theme2 静态资源

修改页面时必须同步检查两套主题，并运行完整测试。

## 部署

部署端只需要 Java 17。配置文件必须命名为 `application.yml`，并作为进程工作目录中的文件提供，以兼容平台基础组件的配置读取方式。详见 [docs/DEPLOY.md](docs/DEPLOY.md)。

## 系统边界

- 本项目负责页面、登录会话、导出与客户导入数据传输。
- `shopifymarketingmerchant` 提供远程业务能力。
- Shopify OAuth、Webhook、Web Pixel 和后台任务继续由业务服务负责。
- 禁止在本项目加入 DataSource、数据库驱动或业务 `@Scheduled` Worker。

## 许可

源码公开仅用于查看和经授权的项目开发，不代表授予公众复制、再发布或商用许可。参见 [LICENSE](LICENSE)。
