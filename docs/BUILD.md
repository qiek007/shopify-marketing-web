# Build Guide

## Requirements

- Java 17
- Apache Maven 3.9.16
- Network access to Maven Central
- The separately supplied `maven-repository` directory containing private artifacts

## Build

Linux or macOS:

```bash
mvn -Dmaven.repo.local=../maven-repository clean test package
```

Windows PowerShell:

```powershell
mvn.cmd "-Dmaven.repo.local=..\maven-repository" clean test package
```

Maven downloads public dependencies from Maven Central into the supplied repository directory and resolves private artifacts already present there.

The build is successful only when all tests pass and `target/shopify-marketing-web.war` exists.

## Build isolation check

Do not rely on an existing user Maven cache. Rename or temporarily move the normal `.m2/repository`, then repeat the command with the supplied repository path.

Do not commit the `maven-repository` directory or generated WAR to this public repository.
