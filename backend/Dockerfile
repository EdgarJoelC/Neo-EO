# ===========================================================================
#  NeoBank - imagen del backend para Render
#
#  Dos etapas: la primera compila con Maven, la segunda solo lleva el JAR y
#  un JRE, de modo que la imagen final no arrastra Maven ni el codigo fuente.
#
#  Se usa la variante 'jammy' (glibc) y no 'alpine' (musl): el saludo TLS
#  contra PostgreSQL gestionado falla con musl en algunos proveedores.
# ===========================================================================

# ---------- etapa 1: compilacion ----------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

# Primero solo el pom, para que Docker cachee las dependencias y no
# las vuelva a descargar cada vez que cambia el codigo.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q -DskipTests -Djava.version=17 clean package

# ---------- etapa 2: ejecucion ----------
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Usuario sin privilegios: el contenedor no corre como root.
RUN useradd --system --create-home --shell /usr/sbin/nologin neobank
USER neobank

COPY --from=build /build/target/*.jar app.jar

# Render asigna el puerto por la variable PORT.
ENV PORT=8080
EXPOSE 8080

# Contenedor pequeno: se limita el heap para no exceder el plan gratuito.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=$PORT -jar app.jar"]
