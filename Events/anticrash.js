const { Client, WebhookClient, MessageEmbed, codeBlock, InteractionAlreadyRepliedError } = require('discord.js');
const { inspect } = require('util');
const moment = require('moment');
require('moment-duration-format');
const colors = require('colors');
const figlet = require('figlet');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { performance } = require('perf_hooks');

// Emojis y estilos visuales super avanzados
const style = {
    emojis: {
        error: '🚨',
        warning: '⚠️',
        info: 'ℹ️',
        success: '✅',
        debug: '🔍',
        critical: '💥',
        separator: '┃',
        arrow: '➜',
        robot: '🤖',
        star: '⭐',
        rocket: '🚀',
        fire: '🔥',
        lightning: '⚡',
        shield: '🛡️',
        brain: '🧠',
        bug: '🐛',
        lock: '🔒',
        globe: '🌍',
        heart: '❤️',
        diamond: '💎',
        crown: '👑',
        trophy: '🏆',
        medal: '🏅',
        clock: '⏰',
        calendar: '📅',
        file: '📄',
        folder: '📁',
        network: '🌐',
        database: '🗄️',
        security: '🔐',
        config: '⚙️',
        thirdParty: '🔗'
    },
    colors: {
        error: '#FF0000',
        warning: '#FFA500',
        info: '#00FF00',
        success: '#00FF00',
        debug: '#0099ff',
        critical: '#FF00FF',
        advanced: '#3A86FF',
        gradient: ['#FF5F6D', '#FFC371', '#DAF7A6', '#FFC371', '#FF5F6D']
    },
    banners: {
        error: '══════════ 🚨 ERROR 🚨 ══════════',
        warning: '═════════ ⚠️ ALERTA ⚠️ ═════════',
        info: '════════ ℹ️ INFO ℹ️ ════════',
        success: '═══════ ✅ ÉXITO ✅ ═══════',
        advanced: '════════ 🚀 AVANZADO 🚀 ════════',
        critical: '════════ 🔥 CRÍTICO 🔥 ════════',
        debug: '════════ 🔍 DEBUG 🔍 ════════'
    }
};

// Configuración del webhook
const config = {
    webhook: new WebhookClient({
        url: 'EL URL DE TU WEBHOOK'
    }),
    logFile: 'bot_errors.log'
};

class ErrorHandler {
    static errorTypes = {
        DISCORD_API: 'DiscordAPIError',
        RATE_LIMIT: 'RateLimitError',
        NETWORK: 'NetworkError',
        DATABASE: 'DatabaseError',
        PERMISSION: 'PermissionError',
        VALIDATION: 'ValidationError',
        RUNTIME: 'RuntimeError',
        UNKNOWN: 'UnknownError',
        FILESYSTEM: 'FileSystemError',
        OS: 'OSError',
        SECURITY: 'SecurityError',
        CONFIGURATION: 'ConfigurationError',
        THIRD_PARTY: 'ThirdPartyError',
        INTERACTION_ALREADY_REPLIED: 'InteractionAlreadyRepliedError'
    };

    static getErrorType(error) {
        if (error instanceof InteractionAlreadyRepliedError) return this.errorTypes.INTERACTION_ALREADY_REPLIED;
        if (error.name === 'DiscordAPIError') return this.errorTypes.DISCORD_API;
        if (error.name === 'RateLimitError') return this.errorTypes.RATE_LIMIT;
        if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') return this.errorTypes.NETWORK;
        if (error.name === 'SequelizeError' || error.name === 'MongoError') return this.errorTypes.DATABASE;
        if (error.name === 'PermissionError' || error.message.includes('permission')) return this.errorTypes.PERMISSION;
        if (error.name === 'ValidationError' || error.name === 'TypeError') return this.errorTypes.VALIDATION;
        if (error instanceof Error) return this.errorTypes.RUNTIME;
        if (error.code === 'ENOENT' || error.code === 'EACCES') return this.errorTypes.FILESYSTEM;
        if (error.name === 'SystemError') return this.errorTypes.OS;
        if (error.name === 'SecurityError') return this.errorTypes.SECURITY;
        if (error.name === 'ConfigurationError') return this.errorTypes.CONFIGURATION;
        if (error.name === 'ThirdPartyError') return this.errorTypes.THIRD_PARTY;
        return this.errorTypes.UNKNOWN;
    }

    static getSeverity(error) {
        const type = this.getErrorType(error);
        switch (type) {
            case this.errorTypes.DISCORD_API:
                return error.status >= 500 ? 'critical' : 'high';
            case this.errorTypes.RATE_LIMIT:
                return 'medium';
            case this.errorTypes.NETWORK:
                return 'high';
            case this.errorTypes.DATABASE:
                return 'critical';
            case this.errorTypes.PERMISSION:
                return 'medium';
            case this.errorTypes.VALIDATION:
                return 'low';
            case this.errorTypes.RUNTIME:
                return 'high';
            case this.errorTypes.FILESYSTEM:
                return 'high';
            case this.errorTypes.OS:
                return 'critical';
            case this.errorTypes.SECURITY:
                return 'critical';
            case this.errorTypes.CONFIGURATION:
                return 'high';
            case this.errorTypes.THIRD_PARTY:
                return 'medium';
            case this.errorTypes.INTERACTION_ALREADY_REPLIED:
                return 'medium';
            default:
                return 'medium';
        }
    }

    static getRecommendations(error, type) {
        const recommendations = {
            [this.errorTypes.DISCORD_API]: [
                'Verifica que los permisos del bot sean correctos',
                'Revisa la documentación de Discord.js para el endpoint específico',
                'Considera implementar un sistema de reintentos'
            ],
            [this.errorTypes.RATE_LIMIT]: [
                'Implementa un sistema de cola para las peticiones',
                'Reduce la frecuencia de las peticiones',
                'Considera cachear resultados frecuentes'
            ],
            [this.errorTypes.NETWORK]: [
                'Verifica la conexión a internet',
                'Implementa un sistema de reintentos con backoff exponencial',
                'Revisa la configuración de firewalls'
            ],
            [this.errorTypes.DATABASE]: [
                'Verifica la conexión con la base de datos',
                'Revisa las consultas SQL/NoSQL',
                'Asegúrate de que los índices estén optimizados'
            ],
            [this.errorTypes.PERMISSION]: [
                'Verifica los permisos del bot en el servidor',
                'Revisa la jerarquía de roles',
                'Asegúrate de tener los intents necesarios'
            ],
            [this.errorTypes.VALIDATION]: [
                'Valida los datos de entrada',
                'Implementa comprobaciones de tipo',
                'Añade manejo de casos nulos'
            ],
            [this.errorTypes.RUNTIME]: [
                'Revisa la lógica del código',
                'Implementa más logging para debug',
                'Considera añadir try-catch adicionales'
            ],
            [this.errorTypes.FILESYSTEM]: [
                'Verifica los permisos de los archivos',
                'Asegúrate de que los archivos existan',
                'Revisa las rutas de los archivos'
            ],
            [this.errorTypes.OS]: [
                'Verifica los recursos del sistema',
                'Revisa los límites de memoria y CPU',
                'Asegúrate de que el sistema operativo esté actualizado'
            ],
            [this.errorTypes.SECURITY]: [
                'Revisa las políticas de seguridad',
                'Asegúrate de que las credenciales estén protegidas',
                'Implementa medidas adicionales de seguridad'
            ],
            [this.errorTypes.CONFIGURATION]: [
                'Verifica la configuración del entorno',
                'Asegúrate de que todas las variables de entorno estén configuradas',
                'Revisa los archivos de configuración'
            ],
            [this.errorTypes.THIRD_PARTY]: [
                'Verifica la disponibilidad del servicio de terceros',
                'Revisa la documentación del servicio',
                'Implementa manejo de errores específico para el servicio'
            ],
            [this.errorTypes.UNKNOWN]: [
                'Implementa logging adicional',
                'Revisa los eventos del sistema',
                'Considera actualizar las dependencias'
            ],
            [this.errorTypes.INTERACTION_ALREADY_REPLIED]: [
                'Asegúrate de no responder a la interacción más de una vez',
                'Revisa el flujo de tu código para evitar múltiples respuestas',
                'Considera usar `deferReply` y `followUp` para respuestas largas'
            ]
        };

        return recommendations[type] || recommendations[this.errorTypes.UNKNOWN];
    }

    static async createErrorEmbed(error, client) {
        const type = this.getErrorType(error);
        const severity = this.getSeverity(error);
        const recommendations = this.getRecommendations(error, type);
        const { default: gradient } = await import('gradient-string');
        const { default: boxen } = await import('boxen');

        const embed = new MessageEmbed()
            .setColor(style.colors[severity])
            .setTitle(`${style.emojis.error} ${style.emojis.robot} Error Detectado: ${type}`)
            .setDescription(codeBlock('js', error.stack || error.message))
            .addFields(
                { name: '📋 Tipo de Error', value: type, inline: true },
                { name: '⚠️ Severidad', value: severity, inline: true },
                { name: '⏰ Timestamp', value: moment().format('YYYY-MM-DD HH:mm:ss'), inline: true },
                { name: '🔍 Detalles Adicionales', value: this.getErrorDetails(error) },
                { name: '💡 Recomendaciones', value: recommendations.map(r => `${style.emojis.arrow} ${r}`).join('\n') },
                { name: '🌐 Información del Sistema', value: this.getSystemInfo() }
            )
            .setFooter({ text: `Bot: ${client.user.tag} | ID: ${client.user.id}` })
            .setTimestamp();

        return embed;
    }

    static getErrorDetails(error) {
        let details = '';

        if (error.code) details += `Código: ${error.code}\n`;
        if (error.method) details += `Método: ${error.method}\n`;
        if (error.path) details += `Ruta: ${error.path}\n`;
        if (error.httpStatus) details += `Estado HTTP: ${error.httpStatus}\n`;

        // Información específica de Discord.js
        if (error.requestData) {
            details += `Datos de la petición: ${inspect(error.requestData, { depth: 0 })}\n`;
        }

        // Información adicional de archivos y líneas
        if (error.fileName) details += `Archivo: ${error.fileName}\n`;
        if (error.lineNumber) details += `Línea: ${error.lineNumber}\n`;

        return details || 'No hay detalles adicionales disponibles';
    }

    static getSystemInfo() {
        return `
            ${style.emojis.globe} Sistema Operativo: ${os.platform()} ${os.release()}
            ${style.emojis.brain} Arquitectura: ${os.arch()}
            ${style.emojis.fire} Uptime: ${moment.duration(os.uptime(), 'seconds').format('d [días], h [horas], m [minutos], s [segundos]')}
            ${style.emojis.clock} Memoria Libre: ${(os.freemem() / 1024 / 1024).toFixed(2)} MB
            ${style.emojis.clock} Memoria Total: ${(os.totalmem() / 1024 / 1024).toFixed(2)} MB
            ${style.emojis.clock} CPU: ${os.cpus().map(cpu => cpu.model).join(', ')}
        `;
    }

    static async log(error, client) {
        const embed = await this.createErrorEmbed(error, client);
        const { default: gradient } = await import('gradient-string');
        const { default: boxen } = await import('boxen');

        // Log to console with gradient colors and boxen
        console.error(boxen(gradient(style.colors.gradient)(`${style.banners.error}\n`), { padding: 1, borderColor: 'yellow', borderStyle: 'round' }));
        console.error(figlet.textSync('ERROR', { font: 'Ghost', horizontalLayout: 'default', verticalLayout: 'default', width: 80, whitespaceBreak: true }));
        console.error(gradient(style.colors.gradient)(inspect(error, { depth: 5 })));

        // Log to file
        fs.appendFile(config.logFile, `ERROR: ${moment().format('YYYY-MM-DD HH:mm:ss')} - ${error.stack || error.message}\n`, (err) => {
            if (err) console.error('Error al escribir en el archivo de log:', err);
        });

        // Send to webhook
        try {
            await config.webhook.send({
                username: 'Sistema Anti-Crash',
                avatarURL: client.user.displayAvatarURL(),
                embeds: [embed]
            });
        } catch (webhookError) {
            console.error('Error al enviar al webhook:', webhookError);
        }
    }

    static async handleUncaughtException(error, client) {
        console.error(colors.bold.red(`[${style.emojis.error}] Uncaught Exception: ${error.message}`));
        await this.log(error, client);
        // Opcional: Reiniciar el bot después de un error crítico
        this.restartBot(client);
    }

    static async handleUnhandledRejection(reason, promise, client) {
        console.error(colors.bold.red(`[${style.emojis.error}] Unhandled Rejection at: ${promise} reason: ${reason}`));
        await this.log(reason, client);
        // Opcional: Reiniciar el bot después de un error crítico
        this.restartBot(client);
    }

    static async handleDiscordError(error, client) {
        console.error(colors.bold.red(`[${style.emojis.error}] Discord Error: ${error.message}`));
        await this.log(error, client);
    }

    static async handleShardError(error, shardId, client) {
        console.error(colors.bold.red(`[${style.emojis.error}] Shard ${shardId} Error: ${error.message}`));
        await this.log(error, client);
    }

    static async restartBot(client) {
        const { default: gradient } = await import('gradient-string');
        const { default: boxen } = await import('boxen');

        console.log(boxen(gradient(style.colors.gradient)(`${style.banners.critical}\n`), { padding: 1, borderColor: 'red', borderStyle: 'round' }));
        console.log(figlet.textSync('REINICIANDO', { font: 'Ghost', horizontalLayout: 'default', verticalLayout: 'default', width: 80, whitespaceBreak: true }));
        console.log(gradient(style.colors.gradient)(`Reiniciando el bot ${client.user.tag} en 5 segundos...`));

        setTimeout(() => {
            process.exit(1);
        }, 5000);
    }

    static async handleFilesystemError(error, client) {
        console.error(colors.bold.red(`[${style.emojis.error}] Error de Archivo: ${error.message}`));
        await this.log(error, client);
    }
}

module.exports = {
    name: 'ready',
    once: true,
    execute: async (client) => {
        // Process-wide error handlers
        process.on('uncaughtException', async (error) => {
            await ErrorHandler.handleUncaughtException(error, client);
        });

        process.on('unhandledRejection', async (reason, promise) => {
            await ErrorHandler.handleUnhandledRejection(reason, promise, client);
        });

        // Discord.js specific error handlers
        client.on('error', async (error) => {
            await ErrorHandler.handleDiscordError(error, client);
        });

        client.on('shardError', async (error, shardId) => {
            await ErrorHandler.handleShardError(error, shardId, client);
        });

        // Filesystem error handler
        process.on('uncaughtExceptionMonitor', (error) => {
            if (error.code === 'ENOENT' || error.code === 'EACCES') {
                ErrorHandler.handleFilesystemError(error, client);
            }
        });

        // Import gradient-string y boxen dinámicamente
        const { default: gradient } = await import('gradient-string');
        const { default: boxen } = await import('boxen');

        console.log(colors.bold.green(boxen(`${style.emojis.success} ${style.emojis.star} Sistema Anti-Crash iniciado correctamente ${style.emojis.star}`, { padding: 1, borderColor: 'green', borderStyle: 'round' })));
        console.log(figlet.textSync('Anti-Crash', { font: 'Ghost', horizontalLayout: 'default', verticalLayout: 'default', width: 80, whitespaceBreak: true }));

        console.log(gradient(style.colors.gradient)(`¡Bienvenido! Protección activada para ${client.user.tag}`));
    }
};