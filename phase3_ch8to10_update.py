from pathlib import Path
import shutil
import docx
from copy import deepcopy
from docx.table import Table
from docx.shared import Pt

base=Path("docs/GRUPO 01 - Pruebas y Calidad de Software (5) - Fase 2.docx")
output=base.with_name("GRUPO 01 - Pruebas y Calidad de Software (5) - Fase 3 (capítulos 8-10).docx")
shutil.copy2(base,output)
doc=docx.Document(str(output))

def in_section(start_text,end_text,prefix,new_text):
    paras=doc.paragraphs
    start=next(i for i,p in enumerate(paras) if p.text.startswith(start_text))
    end=next((i for i,p in enumerate(paras) if i>start and p.text.startswith(end_text)),len(paras))
    for p in paras[start:end]:
        if p.text.startswith(prefix):
            if p.runs:
                p.runs[0].text=new_text
                for r in p.runs[1:]: r.text=""
            else: p.add_run(new_text)
            return True
    print("NO ENCONTRADO",prefix[:90])
    return False

def cell_text(cell,value):
    p=cell.paragraphs[0]
    if p.runs:
        p.runs[0].text=value
        for r in p.runs[1:]: r.text=""
    else: p.add_run(value)
    for extra in cell.paragraphs[1:]: extra._element.getparent().remove(extra._element)

def delete_paras_in(start_text,end_text,prefixes):
    paras=doc.paragraphs
    start=next(i for i,p in enumerate(paras) if p.text.startswith(start_text))
    end=next((i for i,p in enumerate(paras) if i>start and p.text.startswith(end_text)),len(paras))
    for p in list(paras[start:end]):
        if any(p.text.startswith(x) for x in prefixes): p._element.getparent().remove(p._element)

# Chapter 8: preserve the seven-iteration rubric, but ground each group in observable artifacts.
edits8={
"Este capítulo documenta el proceso de desarrollo del software mediante iteraciones": "Las iteraciones siguientes se conservan como estructura solicitada por la rúbrica. Se contrastan con los mensajes del reflog local, la estructura actual del repositorio y su configuración. La correspondencia entre una iteración y un commit es aproximada: el historial disponible no contiene actas o tickets que permitan reconstruir sprints, fechas de inicio ni asignaciones del equipo.",
"La primera iteración del desarrollo de YakuAI estuvo orientada": "El commit inicial b95513c (02/10/2026, “Initial commit”) acredita la creación del repositorio. La estructura vigente incluye frontend, backend, docker y docs; su configuración puede consultarse en docker-compose.yml y en los manifiestos de dependencias.",
"Se estableció un repositorio para gestionar el código fuente": "El historial local registra el commit inicial b95513c y una rama local master. El commit acredita el inicio del historial, mientras que los archivos actuales evidencian la separación entre frontend, backend, documentación e infraestructura.",
"El frontend fue configurado utilizando React con Vite como base": "El frontend actual está configurado con React, TypeScript y Vite, según frontend/package.json y frontend/src. El commit 74f86e8 menciona el plan maestro, las etapas I+II y el rediseño de Hoy; el historial no detalla todas las tareas de configuración inicial.",
"El backend fue configurado utilizando Laravel, estableciendo la estructura": "La estructura actual del backend Laravel contiene rutas, modelos, controladores, servicios, migraciones y pruebas bajo backend/. Esta descripción se respalda en los archivos presentes; no se atribuye cada componente a un commit concreto sin una comparación de cambios.",
"Se configuró MySQL como sistema gestor de base de datos": "Las migraciones Laravel definen el esquema y docker-compose.yml configura MySQL 8.4. Esto acredita configuración versionada, no una instancia de producción desplegada.",
"La segunda iteración estuvo orientada al desarrollo de las primeras funcionalidades operativas": "Como agrupación funcional, esta iteración se vincula al commit 74f86e8 (“feat: plan maestro ETAPA I+II, rediseño Hoy (VD-1) y fixes backend”, 10/10/2026). El mensaje registra avances de planificación, interfaz Hoy y backend, sin detallar cada endpoint.",
"En el backend se implementaron los primeros endpoints de la API REST": "La API actual se organiza bajo /api/v1 y declara recursos en backend/routes. El commit 74f86e8 menciona correcciones de backend; el mensaje por sí solo no identifica una lista de endpoints ni demuestra su ejecución.",
"En el frontend se desarrollaron los primeros componentes e interfaces": "El historial posterior registra el rediseño frontend en 08f279e (12/10/2026) y el panel técnico en a4af3db (12/10/2026). La estructura vigente y sus pantallas se encuentran en frontend/src.",
"Una vez implementadas las funcionalidades iniciales, se estableció la comunicación": "La comunicación actual entre React y Laravel se realiza mediante solicitudes HTTP/JSON a la API. La configuración del cliente se encuentra en frontend/src/api y la definición de rutas en backend/routes; no se atribuye una fecha específica de integración.",
"La tercera iteración estuvo enfocada en la implementación de los principales módulos": "Esta iteración agrupa el rediseño frontend documentado por 08f279e (“rediseño total shadcn/ui + Tailwind v4”) y a4af3db (“v4 panel técnico”, ambos 12/10/2026), junto con los módulos y recursos que existen actualmente en el repositorio.",
"Durante esta iteración se implementaron los módulos relacionados con la gestión": "La versión actual contiene módulos de agricultores, parcelas, sensores, evaluaciones, clima, alertas derivadas y riegos. El reflog registra cambios de interfaz y backend, pero no vincula cada CRUD a un commit; las operaciones disponibles deben leerse de las rutas y políticas por recurso.",
"Asimismo, se desarrollaron funcionalidades para consultar el historial de evaluaciones": "El esquema actual conserva evaluaciones y riegos aplicados. Las alertas se construyen al consultarlas y no se almacenan como entidad Alert.",
"Se implementaron formularios para facilitar el registro y actualización": "La interfaz contiene formularios por recurso y validaciones de cliente/servidor. La etapa de cultivo se deriva durante la evaluación a partir del cultivo y sus etapas; no se registra como una etapa persistida directamente en la parcela.",
"Los formularios incorporan validaciones para verificar que la información": "Los formularios y la API validan campos de acuerdo con cada recurso. En parcelas se guardan cultivo y textura de suelo; la etapa de cultivo se determina desde el cultivo y la fecha de siembra durante el cálculo.",
"Los módulos administrativos implementan operaciones CRUD": "Las rutas y permisos actuales definen las operaciones disponibles por recurso. No se afirma que todas las entidades permitan crear, consultar, actualizar y eliminar; debe verificarse cada endpoint en backend/routes.",
"La cuarta iteración estuvo orientada a integrar las fuentes": "El historial vincula parcialmente este grupo con 9138a91 (16/10/2026), cuyo mensaje menciona riego dinámico, OpenWeatherMap real y limpieza de documentación. La recepción de mediciones y Web Serial existe en el código actual, aunque el reflog consultado no permite asignarla con precisión a ese commit.",
"Se implementó el mecanismo de recepción y almacenamiento de las mediciones": "El sistema contempla sensores y mediciones normalizadas. En la maqueta, Arduino se comunica directamente con el navegador mediante USB/Web Serial; el navegador transmite los datos al flujo de la aplicación. No se describe como una conexión remota directa Arduino–API.",
"Cada medición recibida se relaciona con el sensor y la parcela correspondiente": "La API relaciona mediciones con sensor y parcela y valida el origen según el endpoint. La conexión de maqueta por Web Serial es navegador–Arduino; no se atribuye a ese flujo un token independiente del dispositivo sin evidencia específica.",
"Se incorporó la comunicación con OpenWeatherMap para obtener información": "El commit 9138a91 menciona integración OWM real. El código actual usa el proveedor cuando está configurado y contempla origen demo/fallback ante ausencia de credenciales o fallos; los datos de fallback no deben presentarse como observaciones reales.",
"La consulta del servicio meteorológico se realiza desde el backend": "La consulta de OpenWeatherMap se implementa en el backend para no exponer la clave al frontend. La presencia del proveedor en código no acredita que la API externa estuviera disponible durante una ejecución concreta.",
"Las mediciones de los sensores y los datos meteorológicos se almacenan y relacionan": "Las mediciones y pronósticos se asocian a parcelas según los modelos y migraciones actuales. La disponibilidad de datos externos depende de configuración y conectividad.",
"La quinta iteración estuvo enfocada en la implementación del motor": "El código actual organiza la evaluación en HydroService y Evaluation. El reflog registra una evolución del flujo de evaluación en e79bde7 (19/10/2026), seguida por el commit 563d6f7 que revierte cambios y conserva una arquitectura v5; esta secuencia debe leerse como historial, no como funciones todas vigentes.",
"Antes de realizar una evaluación, el sistema verifica que los datos necesarios": "La evaluación utiliza datos de parcela, cultivo/etapa, textura, medición válida y pronóstico conforme a las reglas implementadas. La vigencia y suficiencia se validan antes de producir un estado normal.",
"Cuando la información requerida está incompleta o desactualizada": "Cuando falta información crítica o no cumple reglas de validez, la evaluación puede quedar incompleta y explicar la condición. Las alertas se derivan al consultarlas; no se persisten en una tabla alerts.",
"Una vez validados los datos, el motor procesa la información mediante las reglas": "HydroService calcula ET0 y datos del snapshot y aplica las reglas codificadas. ETc se registra como dato del contexto, pero no debe afirmarse que por sí sola determine la decisión; la pertinencia agronómica requiere validación de campo.",
"Como resultado del análisis, el motor determina una de las tres recomendaciones posibles:": "La evaluación actual puede devolver cuatro estados: regar, no regar, esperar o evaluación incompleta.",
"Además de la decisión, la evaluación puede incluir": "La respuesta puede incorporar cantidad estimada, confianza, próxima revisión y explicación cuando esos campos estén disponibles; no todos aplican a un resultado incompleto.",
"La sexta iteración estuvo orientada a presentar los resultados": "Esta agrupación reúne el rediseño de evaluación v5 documentado por e79bde7 y la evolución v6/v7/v8 del repositorio. La cronología de commits muestra ajustes y una reversión, por lo que no se presentan todos los cambios intermedios como estado final simultáneo.",
"Se implementó la presentación de las recomendaciones generadas": "La interfaz presenta el estado y los datos disponibles de la evaluación. El commit e79bde7 describe un flujo completo de evaluación v5; el reflog registra después una reversión parcial y versiones posteriores.",
"Se incorporó un mecanismo de alertas para informar sobre situaciones": "La API deriva alertas de condiciones de sensores y evaluaciones; no existe una entidad Alert persistida.",
"Las alertas quedan asociadas a la parcela correspondiente": "La consulta calcula alertas a partir de sensores y evaluaciones vinculados a la parcela; no se guarda una fila de alerta ni un historial independiente.",
"Se contempló el envío de notificaciones para comunicar información": "Correo y WhatsApp son integraciones opcionales que requieren credenciales y servicios/procesos activos. El mensaje manual para compartir no acredita un envío automatizado.",
"La séptima iteración estuvo orientada al registro y consulta": "El historial local culmina en 5e5f78e (“preparar versión v7”, 25/10/2026) y 986bd6c (“Release v8”, 27/10/2026). Estos mensajes permiten ubicar versiones, no certificar despliegue o aceptación.",
"Se implementó el almacenamiento de las evaluaciones generadas": "Evaluation conserva resultados y snapshots conforme al modelo y las migraciones. Los commits de versiones posteriores incluyen evolución de interfaz e integración, pero no acreditan la carga de datos de una instancia concreta.",
"Se incorporó la funcionalidad para que el agricultor pueda registrar": "Irrigation registra riegos aplicados y puede relacionarlos con evaluaciones o correcciones. El registro es una acción declarada por el usuario y no una medición física automática del volumen aplicado.",
"Durante las iteraciones posteriores estuvieron orientadas": "Los commits 5e5f78e y 986bd6c registran preparación v7 y Release v8. Esta revisión no dispone de tickets que expliquen cada ajuste posterior.",
"Las iteraciones posteriores estuvieron orientadas a mejorar": "Los mensajes de commits permiten observar refactorización por funcionalidades, preparación de versión y release. No se atribuyen defectos corregidos ni resultados de pruebas sin un diff o reporte específico.",
"Se consolidaron las funcionalidades desarrolladas en las iteraciones anteriores": "La estructura actual integra frontend, API, persistencia, servicios de clima, evaluación y riegos. La correspondencia con versiones y commits se resume en la tabla del capítulo 9.",
}
for prefix,text in edits8.items(): in_section("CAPÍTULO 8","CAPÍTULO 9",prefix,text)
in_section("CAPÍTULO 8","CAPÍTULO 9","La sexta iteración estuvo orientada a presentar los resultados","Esta agrupación describe la presentación de evaluaciones, alertas derivadas y canales opcionales. Los componentes actuales se verifican en los módulos de frontend y backend; el historial consultado no asocia cada uno con un commit independiente.")
in_section("CAPÍTULO 8","CAPÍTULO 9","Con esta iteración se mejoró la comunicación entre YakuAI","La interfaz presenta evaluaciones y alertas derivadas; el envío automático de notificaciones depende de credenciales y procesos activos, y no se documenta aquí como entrega comprobada.")
in_section("CAPÍTULO 8","CAPÍTULO 9","Con esta iteración se completó el flujo principal de YakuAI","La secuencia resume el flujo funcional representado en el repositorio; no acredita por sí sola que el sistema esté desplegado, que existan datos productivos o que el proceso haya sido aceptado en campo.")
in_section("CAPÍTULO 8","CAPÍTULO 9","Las iteraciones posteriores estuvieron orientadas a mejorar","Los commits 5e5f78e y 986bd6c registran preparación v7 y Release v8. Esta revisión no dispone de tickets que expliquen cada ajuste posterior.")
in_section("CAPÍTULO 8","CAPÍTULO 9","Se realizaron ajustes en la validación de los datos utilizados","El código actual incluye validación de entradas, normalización de mediciones y separación de lógica de dominio en servicios. Sin tickets o diffs asociados, no se asignan estos elementos a una corrección histórica concreta.")
in_section("CAPÍTULO 8","CAPÍTULO 9","Durante la integración se identificaron situaciones","Los riesgos que deben controlarse incluyen mediciones ausentes o vencidas, datos meteorológicos incompletos y fallos del proveedor externo. No se aportó un registro de incidencias fechado que pruebe que fueran defectos históricos observados.")
in_section("CAPÍTULO 8","CAPÍTULO 9","Para atender estos problemas se incorporaron validaciones","El motor actual valida disponibilidad y calidad de los datos antes de evaluar y puede devolver un estado incompleto. La clave de OpenWeatherMap se configura en el backend; la maqueta Arduino se conecta al navegador por USB/Web Serial. No se afirma una autenticación mediante token independiente del sensor.")
in_section("CAPÍTULO 8","CAPÍTULO 9","Estas mejoras permitieron fortalecer la estabilidad del sistema","La configuración y el código muestran controles implementados, pero no se adjuntan métricas de estabilidad ni resultados de pruebas que permitan cuantificar su efecto.")

# Remove hypothetical/fabricated branch examples and editorial draft note from chapter 9.
edits9={
"Este capítulo describe cómo se gestionó el código fuente": "Este capítulo resume la evidencia local del repositorio consultado: commits del reflog, referencia actual y configuración de CI. La tabla relaciona los grupos funcionales del capítulo 8 con mensajes de commits; no los presenta como actas de sprint.",
"El código fuente de YakuAI se gestiona mediante un repositorio en GitHub": "La configuración local identifica un remoto origin en GitHub. El reflog local registra el historial consultado hasta el commit Release v8; esto no acredita el estado actual del servidor remoto.",
"La estrategia de ramificación definida contempla una rama principal": "La referencia local actual es master. El workflow .github/workflows/ci.yml configura disparadores para push a main/develop y pull request a main; esta diferencia entre el checkout local y CI debe validarse con el equipo antes de afirmar una estrategia de ramas aplicada.",
"El flujo de trabajo consiste en desarrollar cada funcionalidad": "Los archivos consultados no bastan para confirmar revisiones, aprobaciones o un flujo de integración aplicado; se conserva únicamente la configuración verificable de CI.",
"El flujo general se representa de la siguiente manera:": "Workflow CI configurado:",
"Rama principal → Rama feat/* → Desarrollo → Pruebas y validaciones → Commit → Integración a la rama principal": "push a main/develop → pruebas backend y frontend, lint/build → pull request a main; la configuración no demuestra que un pipeline específico haya pasado.",
"Para registrar los cambios realizados se establece el uso de commits convencionales": "Los mensajes del historial consultado describen cambios y versiones, pero no se encontró una declaración de convención uniforme de commits.",
"Esta es la versión que pondría en tu informe.": "",
"La gestión de ramas de YakuAI se definió con el propósito": "La evidencia disponible muestra una referencia local master y un workflow que menciona main/develop. No se infiere una estrategia feat/* ni una política de merges no acreditada.",
"La rama principal concentra la versión integrada del proyecto": "La rama local observada es master; el último hash apuntado por refs/heads/master corresponde a Release v8. No se afirma que master sea la rama predeterminada del remoto.",
"Para el desarrollo de nuevas características se definió el uso de ramas": "El reflog incluye cambios en master y movimientos/reversiones, pero no proporciona evidencia suficiente para documentar ramas de funcionalidad como práctica vigente.",
"Algunos ejemplos de nomenclatura aplicable al proyecto son:": "No se enumeran ramas hipotéticas como si existieran en el repositorio.",
"Una vez finalizada y verificada una funcionalidad, sus cambios pueden integrarse": "Para documentar ramas y pull requests adicionales, incorporar una captura o exportación actual del remoto.",
"No se incluye una rama develop porque la estrategia definida": "El workflow sí menciona develop y main; debe alinearse el YAML con la rama real del repositorio si se desea documentar la política de integración.",
"El registro de commits permite evidenciar los cambios realizados": "La tabla siguiente selecciona referencias verificables del reflog local, con fecha, hash corto y mensaje de commit. La relación con iteraciones es aproximada y se basa en el mensaje, no en actas.",
"Los commits relevantes serán seleccionados del historial": "Los registros se transcriben del reflog local. Las fechas se presentan en hora de Perú (UTC-5); los mensajes no se amplían más allá de lo que registra Git.",
"Este registro permitirá posteriormente relacionar los cambios almacenados": "Las referencias son evidencia de cambios registrados localmente. Para una trazabilidad completa, complementar con pull requests, autores, diffs y resultados de CI del remoto.",
}
for prefix,text in edits9.items(): in_section("CAPÍTULO 9","CAPÍTULO 10",prefix,text)
in_section("CAPÍTULO 9","CAPÍTULO 10","Para documentar ramas y pull requests adicionales","No se incluyen ramas hipotéticas; las referencias verificables se limitan a la configuración local y al reflog consultado.")
delete_paras_in("CAPÍTULO 9","CAPÍTULO 10",["feat/sensores","feat/parcelas","feat/evaluacion-riego","feat/alertas","feat/historial-riegos","Figura X. Historial de commits","[Captura de GitHub]","Fuente: Repositorio del proyecto."])

# Replace the placeholder commit table with selected actual reflog entries.
t=doc.tables[39]
headers=("Iteración / grupo","Commit y fecha local","Cambio registrado en el mensaje del commit")
for c,v in zip(t.rows[0].cells,headers): cell_text(c,v)
entries=[
 ("1. Base del repositorio","b95513c · 02/10/2026","Initial commit."),
 ("2. Plan e interfaz inicial","74f86e8 · 10/10/2026","Plan maestro ETAPA I+II, rediseño Hoy (VD-1) y fixes backend."),
 ("3. Frontend y panel técnico","08f279e · 12/10/2026; a4af3db · 12/10/2026","Rediseño frontend shadcn/ui + Tailwind v4; panel técnico v4."),
 ("4. Clima y riego dinámico","9138a91 · 16/10/2026","Riego recomendado dinámico, OWM real y limpieza de documentación."),
 ("5. Flujo de evaluación v5","e79bde7 · 19/10/2026; 563d6f7 · 19/10/2026","Flujo de evaluación v5; después se registró un commit de reversión (“v5 puro: revertir cambios remoto, solo arquitectura v5”). No se asume que ambos estados estén vigentes."),
 ("6. Refactorización frontend","e0b822f · 23/10/2026","Rediseño frontend feature-based y limpieza de artefactos (v6)."),
 ("7. Preparación y release","5e5f78e · 25/10/2026; 986bd6c · 27/10/2026","Preparar versión v7; Release v8. El release local no demuestra despliegue productivo."),
]
while len(t.rows)<len(entries)+1:
    t._tbl.append(deepcopy(t.rows[-1]._tr))
while len(t.rows)>len(entries)+1:
    t._tbl.remove(t.rows[-1]._tr)
for row,vals in zip(t.rows[1:],entries):
    for c,v in zip(row.cells,vals): cell_text(c,v)
for pfx,val in [("Tabla X. Registro de commits relevantes","Tabla 9.1. Relación aproximada entre iteraciones y commits verificados"),("Fuente: Elaboración propia a partir del repositorio del proyecto.","Fuente: reflog local de .git/logs/HEAD; fecha convertida a hora de Perú (UTC-5). Mensajes resumidos literalmente.")]:
    in_section("CAPÍTULO 9","CAPÍTULO 10",pfx,val)

# Chapter 10: describe actual Compose services and distinguish development from production.
edits10={
"Este capítulo describe el proceso de dockerización del sistema": "Este capítulo documenta la configuración Docker/Compose versionada. Se distinguen el entorno local, que monta código y ejecuta Vite, y la configuración de producción, que construye imágenes separadas y sirve el frontend estático. La configuración no demuestra por sí sola un despliegue realizado.",
"Para el desarrollo de YakuAI se utiliza Docker como herramienta": "docker-compose.yml define servicios coordinados para desarrollo local. El backend se monta desde el host, Vite sirve el frontend y MySQL/Redis se ejecutan como servicios internos con volúmenes y health checks.",
"El uso de Docker proporciona diferentes beneficios durante el desarrollo de YakuAI:": "La configuración Compose facilita repetir servicios y parámetros definidos en archivos versionados. La disponibilidad real depende de Docker Engine, variables locales y ejecución correcta.",
"La dockerización de YakuAI tiene como objetivo proporcionar un entorno reproducible": "El Compose local configura un entorno de desarrollo reproducible; docker-compose.production.yml configura imágenes y servicios para un posible despliegue. No se afirma que producción se haya ejecutado.",
"El backend de YakuAI, desarrollado con Laravel, se ejecuta dentro": "El backend se define como Laravel/PHP-FPM en el servicio app; Nginx publica la API en desarrollo. La configuración productiva separa la imagen app de la imagen Nginx API.",
"Para la dockerización del backend se utiliza un Dockerfile": "docker/php/Dockerfile define construcción de PHP y dependencias Composer. En desarrollo Compose monta backend/; en producción usa el target de producción y una imagen sin bind mount del código.",
"El entorno de ejecución del backend se configura mediante variables": "Las variables se cargan desde .env en desarrollo y Compose de producción exige parámetros como APP_KEY, APP_URL y credenciales de base de datos. Los secretos deben permanecer fuera del repositorio.",
"El frontend de YakuAI, desarrollado con React y Vite, se integra": "En desarrollo, el servicio frontend monta frontend/ y expone Vite en el puerto interno 5173 (host configurable; predeterminado 8081). En producción, el Dockerfile compila activos estáticos que sirve Nginx en el puerto 80 interno.",
"El contenedor del frontend se configura para disponer del entorno": "El contenedor local usa Vite para desarrollo. La imagen productiva sirve archivos compilados mediante Nginx; Vite no es el servidor de producción descrito.",
"La comunicación entre el frontend y el backend se realiza mediante solicitudes HTTP": "En desarrollo, el frontend consume la API a través de Nginx en el puerto host configurable (por defecto 8082). En producción, Nginx frontend y Nginx API se comunican por la red interna Compose.",
"Para coordinar la ejecución de los diferentes componentes de YakuAI": "docker-compose.yml declara MySQL, Redis, app PHP-FPM, Nginx API y frontend Vite; scheduler y worker están en el perfil produccion. docker-compose.production.yml separa app, API Nginx, frontend estático, MySQL, Redis, scheduler y worker.",
"Servicio frontend: El servicio frontend ejecuta": "Desarrollo: frontend ejecuta Vite y monta el código local. Producción: frontend sirve los activos estáticos mediante Nginx.",
"Servicio backend: El servicio backend ejecuta": "Backend: app ejecuta Laravel/PHP-FPM; Nginx expone la API en desarrollo y se separa como servicio api en producción.",
"Servicio de base de datos: El servicio de base de datos utiliza MySQL": "MySQL: servicio interno con volumen persistente y health check; la aplicación se conecta por la red Compose.",
"Docker Compose permite iniciar y coordinar estos servicios": "Los comandos siguientes describen operaciones configuradas para desarrollo y producción. La presencia de los comandos no constituye evidencia de que se hayan ejecutado en este proyecto.",
}
for prefix,text in edits10.items(): in_section("CAPÍTULO 10","CAPÍTULO 11",prefix,text)
in_section("CAPÍTULO 10","CAPÍTULO 11","Asimismo, permite mantener separados los componentes","La configuración local permite ejecutar los servicios en conjunto; las diferencias de producción se detallan en la matriz de este capítulo.")
in_section("CAPÍTULO 10","CAPÍTULO 11","De esta manera, la imagen generada contiene los elementos","La imagen de producción se construye con dependencias y código definidos por el Dockerfile; no se documenta como una imagen ya desplegada.")
in_section("CAPÍTULO 10","CAPÍTULO 11","La ejecución de los servicios se coordina mediante Docker Compose","La comunicación entre servicios se define en la red interna Compose y depende de que los contenedores estén iniciados y saludables.")
in_section("CAPÍTULO 10","CAPÍTULO 11","El servicio frontend se incorpora a Docker Compose","La tabla siguiente resume servicios y comandos configurados para ambos entornos.")
delete_paras_in("CAPÍTULO 10","CAPÍTULO 11",["docker-compose.yml declara MySQL","Backend: app ejecuta Laravel/PHP-FPM","MySQL: servicio interno con volumen persistente","Los comandos siguientes describen operaciones"])

def insert_table_after(anchor_prefix,rows,style_source):
    paras=doc.paragraphs
    a=next((p for p in paras if p.text.startswith(anchor_prefix)),None)
    if a is None: raise RuntimeError("Ancla no encontrada: "+anchor_prefix)
    tbl=deepcopy(style_source._tbl)
    proxy=Table(tbl,doc._body)
    while len(proxy.rows)<len(rows):
        tbl.append(deepcopy(proxy.rows[-1]._tr)); proxy=Table(tbl,doc._body)
    while len(proxy.rows)>len(rows):
        tbl.remove(proxy.rows[-1]._tr); proxy=Table(tbl,doc._body)
    for i,row in enumerate(rows):
        for j,v in enumerate(row): cell_text(proxy.cell(i,j),v)
    a._p.addnext(tbl)
    return proxy

# Add service matrix and exact commands using styles already present in the report.
in_section("CAPÍTULO 10","CAPÍTULO 11","Orquestación con Docker Compose","Tabla 10.1. Servicios configurados para desarrollo y producción")
service_table=insert_table_after("Tabla 10.1. Servicios configurados",[
 ("Entorno","Servicio","Función y exposición configurada"),
 ("Desarrollo","mysql","MySQL 8.4; red interna, volumen mysql_data y health check."),
 ("Desarrollo","redis","Redis 7; red interna, volumen redis_data y health check."),
 ("Desarrollo","app + nginx","Laravel/PHP-FPM y Nginx API; API publicada en 127.0.0.1:8082 por defecto."),
 ("Desarrollo","frontend","Vite, código montado; 127.0.0.1:8081 → 5173 por defecto."),
 ("Producción","mysql + redis","Servicios internos con persistencia y health checks."),
 ("Producción","app + api","Laravel/PHP-FPM y Nginx API separado; sin puerto API publicado directamente al host."),
 ("Producción","frontend","Activos compilados servidos por Nginx; puerto host configurable, interno 80."),
 ("Producción","scheduler + worker","Procesos Laravel para tareas programadas y colas Redis; servicios separados."),
],doc.tables[44])
# Retain the existing subsection heading and keep the table caption immediately above its table.
compose_heading=next(p for p in doc.paragraphs if p.text.startswith("Tabla 10.1. Servicios configurados"))
compose_heading.runs[0].text="Orquestación con Docker Compose"
caption=doc.add_paragraph("Tabla 10.1. Servicios configurados para desarrollo y producción")
caption._p.getparent().remove(caption._p)
compose_heading._p.addnext(caption._p)

cmd_caption=doc.add_paragraph("Tabla 10.2. Comandos Docker Compose por entorno")
cmd_caption._p.getparent().remove(cmd_caption._p)
service_table._tbl.addnext(cmd_caption._p)
commands_table=insert_table_after("Tabla 10.2. Comandos Docker Compose",[
 ("Uso","Comando desde la raíz del proyecto","Qué permite verificar o hacer"),
 ("Desarrollo: iniciar","docker compose up -d --build","Construye e inicia servicios locales definidos en docker-compose.yml."),
 ("Desarrollo: migrar","docker compose run --rm app php artisan migrate --force","Aplica migraciones en la base del entorno local."),
 ("Desarrollo: seeders","docker compose run --rm app php artisan db:seed --force","Carga datos de desarrollo previstos por seeders."),
 ("Desarrollo: revisión","docker compose exec -T app php artisan test --no-ansi","Ejecuta la suite backend en el contenedor local; no se reporta aquí un resultado."),
 ("Desarrollo: scheduler/worker","docker compose --profile produccion up -d --build","Activa servicios de fondo definidos en el perfil; no es el Compose productivo."),
 ("Producción: validar configuración","docker compose -f docker-compose.production.yml config --quiet","Valida sintaxis y resolución de variables de Compose."),
 ("Producción: iniciar","docker compose -f docker-compose.production.yml up -d --build","Construye e inicia las imágenes configuradas; requiere secretos y URL válidos."),
 ("Producción: estado","docker compose -f docker-compose.production.yml ps","Consulta estado actual de los servicios en el entorno donde se ejecute."),
],doc.tables[39])

# Label the new tables and cite the configuration sources in prose.
src_p=doc.add_paragraph("Fuente: docker-compose.yml, docker-compose.production.yml, docs/operacion/desarrollo-local.md y docs/operacion/despliegue-produccion.md. Comandos documentados; no se afirma su ejecución.")
src_p._p.getparent().remove(src_p._p)
commands_table._tbl.addnext(src_p._p)

doc.save(str(output))
print(f"actualizado={output}; tablas={len(doc.tables)}; bytes={output.stat().st_size}")
