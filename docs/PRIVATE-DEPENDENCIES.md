# Private Maven Dependencies

Private artifacts are delivered separately as a Maven local repository archive. They are not published in this public repository.

The archive contains each private JAR and its POM in Maven repository layout, plus a manifest and SHA-256 checksums. Public dependencies are downloaded from Maven Central during the build.

Do not upload the private archive to a public release, package registry, source repository, or third-party file-sharing service without written authorization.
