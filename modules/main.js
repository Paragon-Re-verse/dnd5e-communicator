import { Dnd5eCommunicator } from './communicator.js';
import { registerSettings } from './settings.js';
import { registerAPI } from './api.js';

const MODULE_NAME = 'dnd5e-communicator';

/**
 * Выводит отладочное сообщение в консоль, если включен режим дебага
 * @param {string} message - Сообщение для вывода
 * @param {...any} args - Дополнительные аргументы
 */
function debug(message, ...args) {
    const debugMode = game.settings?.get(MODULE_NAME, 'debugMode') ?? false;
    if (debugMode) {
        console.log(`D&D 5e Communicator | DEBUG | ${message}`, ...args);
    }
}

// ─── Инициализация модуля ──────────────────────────────────────

Hooks.once('init', () => {
    console.log('D&D 5e Communicator | Initializing');
    registerSettings();
    registerAPI();

    // Добавление кнопки в инструменты токенов (v12 + v13)
    Hooks.on('getSceneControlButtons', (controls) => {
        const allowPlayersAccess = game.settings.get(MODULE_NAME, 'allowPlayersAccess');
        if (!game.user.isGM && !allowPlayersAccess) return;

        const isV13 = !foundry.utils.isNewerVersion('13.0.0', game.version);
        const tokenControl = isV13 ? controls.tokens : controls.find(c => c.name === 'token');

        if (!tokenControl?.tools) return;

        const toolConfig = {
            name: 'communicator',
            title: game.i18n.localize('DNDCOM.Settings.Communicator') || 'D&D 5e Communicator',
            icon: 'fas fa-satellite-dish',
            visible: true,
            button: true
        };

        if (isV13) {
            tokenControl.tools['communicator'] = {
                ...toolConfig,
                onChange: () => {
                    debug('Button clicked (v13)');
                    Dnd5eCommunicator.openCommunicatorSettings();
                }
            };
        } else {
            if (!tokenControl.tools.some(t => t.name === 'communicator')) {
                tokenControl.tools.push({
                    ...toolConfig,
                    onClick: () => {
                        debug('Button clicked (v12)');
                        Dnd5eCommunicator.openCommunicatorSettings();
                    }
                });
            }
        }
    });
});

// ─── Готовность системы ────────────────────────────────────────

Hooks.once('ready', () => {
    console.log('D&D 5e Communicator | Ready');

    // Применяем CSS-переменные для шрифта из сохранённых настроек
    try {
        const fontSize = game.settings.get(MODULE_NAME, 'messageFontSize') || 14;
        const fontFamily = game.settings.get(MODULE_NAME, 'fontFamily') || 'MOSCOW2024';
        const messageWidth = game.settings.get(MODULE_NAME, 'globalMessageWidth') || 40;
        const debugMode = game.settings.get(MODULE_NAME, 'debugMode') ?? false;

        document.documentElement.style.setProperty('--message-font-size', `${fontSize}px`);
        document.documentElement.style.setProperty('--message-font', fontFamily);
        document.documentElement.style.setProperty('--message-width', `${messageWidth}%`);
        document.documentElement.style.setProperty('--message-left', `${(100 - messageWidth) / 2}%`);

        debug('Module ready', { fontSize, fontFamily, messageWidth, debugMode });
    } catch (error) {
        console.error('D&D 5e Communicator | Error applying CSS settings:', error);
        document.documentElement.style.setProperty('--message-font-size', '14px');
        document.documentElement.style.setProperty('--message-font', 'MOSCOW2024');
        document.documentElement.style.setProperty('--message-width', '40%');
        document.documentElement.style.setProperty('--message-left', '30%');
    }

    Dnd5eCommunicator.initSocketListeners();

    // Registrar o comando de chat (/lcm)
    Hooks.on('chatMessage', (chatLog, messageText, chatData) => {
        if (messageText.trim().startsWith('/lcm')) {
            handleDnd5eCommunicatorCommand(messageText);
            return false; // Evita que a mensagem seja enviada ao chat regular
        }
    });
});

/**
 * Processa comandos do D&D 5e Communicator no chat
 * @param {string} messageText - O texto digitado pelo usuário
 */
function handleDnd5eCommunicatorCommand(messageText) {
    const rawArgs = messageText.trim().substring(4).trim(); // Remove "/lcm"

    if (!rawArgs) {
        Dnd5eCommunicator.openCommunicatorSettings();
        return;
    }

    const args = rawArgs.split(/\s+/);
    const cmd = args[0].toLowerCase();

    if (cmd === 'config') {
        Dnd5eCommunicator.openCommunicatorSettings();
    } else if (cmd === 'log' || cmd === 'history') {
        Dnd5eCommunicator.openSaveMessagesDialog();
    } else if (cmd === 'help') {
        displayHelpMessage();
    } else if (cmd === 'send') {
        const sendContent = rawArgs.substring(4).trim(); // Remove "send"
        handleDirectSend(sendContent);
    } else {
        ui.notifications.warn(`D&D 5e Communicator: Comando desconhecido "${cmd}". Digite "/lcm help" para ajuda.`);
    }
}

/**
 * Exibe a mensagem de ajuda no chat como sussurro para o usuário
 */
function displayHelpMessage() {
    const helpContent = `
        <div class="lcm-chat-help">
            <h3 style="border-bottom: 1px solid var(--lcm-neon-green, #03FB8D); padding-bottom: 3px; color: var(--lcm-neon-green, #03FB8D); margin-top: 0;">D&D 5e Communicator - Comandos</h3>
            <p style="margin: 4px 0;"><strong>/lcm</strong> ou <strong>/lcm config</strong> : Abre as configurações do comunicador.</p>
            <p style="margin: 4px 0;"><strong>/lcm log</strong> ou <strong>/lcm history</strong> : Abre o histórico de mensagens.</p>
            <p style="margin: 4px 0;"><strong>/lcm send [Personagem] | [Mensagem]</strong> : Envia uma mensagem rapidamente. Use a barra vertical (|) para separar o nome do personagem do texto.</p>
            <p style="margin: 4px 0;"><strong>/lcm help</strong> : Exibe esta ajuda.</p>
        </div>
    `;

    ChatMessage.create({
        user: game.user.id,
        content: helpContent,
        whisper: [game.user.id],
        speaker: { alias: "D&D 5e Communicator" }
    });
}

/**
 * Processa e envia uma mensagem do comunicador diretamente
 * @param {string} sendContent - O texto após o comando send
 */
function handleDirectSend(sendContent) {
    if (!sendContent) {
        ui.notifications.warn("D&D 5e Communicator: Por favor, especifique uma mensagem. Uso: /lcm send [Personagem] | [Mensagem]");
        return;
    }

    let characterName = "";
    let message = "";

    if (sendContent.includes("|")) {
        const parts = sendContent.split("|");
        characterName = parts[0].trim();
        message = parts.slice(1).join("|").trim();
    } else {
        message = sendContent.trim();
        const activeToken = canvas.tokens?.controlled[0];
        characterName = activeToken?.actor?.name || 
                        game.user.character?.name || 
                        game.settings.get(MODULE_NAME, 'lastCharacterName') || 
                        game.user.name;
    }

    if (!message) {
        ui.notifications.warn("D&D 5e Communicator: Mensagem vazia.");
        return;
    }

    // Busca o retrato associado
    let portraitPath = "";
    const actor = game.actors.find(a => a.name === characterName);
    if (actor) {
        portraitPath = actor.img;
    }
    if (!portraitPath) {
        portraitPath = game.settings.get(MODULE_NAME, 'lastPortrait') || game.user.avatar || "icons/svg/mystery-man.svg";
    }

    const soundPath = game.settings.get(MODULE_NAME, 'lastSound') || '';
    const voiceoverPath = game.settings.get(MODULE_NAME, 'lastVoiceover') || '';
    const style = game.settings.get(MODULE_NAME, 'lastMessageStyle') || 'green';
    const fontSize = game.settings.get(MODULE_NAME, 'messageFontSize') || 14;
    const fontFamily = game.settings.get(MODULE_NAME, 'fontFamily') || 'MOSCOW2024';
    const typingSpeed = game.settings.get(MODULE_NAME, 'lastTypingSpeed');
    const messageWidth = game.settings.get(MODULE_NAME, 'lastMessageWidth') || game.settings.get(MODULE_NAME, 'globalMessageWidth') || 40;
    const postToChat = game.settings.get(MODULE_NAME, 'postToChat');

    Dnd5eCommunicator.sendCommunicatorMessage(
        characterName,
        portraitPath,
        message,
        soundPath,
        voiceoverPath,
        style,
        fontSize,
        fontFamily,
        typingSpeed,
        messageWidth,
        postToChat
    );
}



// ─── Helper: inject the log button into sidebar-tabs ───────────


function _injectLogButton() {
    try {
        const isGM = game.user?.isGM;
        const allowExport = isGM || (game.settings.get(MODULE_NAME, 'allowPlayersExport') ?? false);
        const allowAccess = isGM || (game.settings.get(MODULE_NAME, 'allowPlayersAccess') ?? true);

        if (!allowAccess && !allowExport) return;


        if (document.getElementById('lcm-save-messages-btn')) return;

        const menuEl =
            document.querySelector('#sidebar menu.flexcol') ||
            document.querySelector('#ui-right menu.flexcol') ||
            document.querySelector('menu.flexcol'); 

        if (!menuEl) return;

        const tooltipText = game.i18n.localize('DNDCOM.Settings.ChatLog.ButtonTitle') || 'Communicator Log';


        const liItem = document.createElement('li');


        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'lcm-save-messages-btn';
        
        btn.className = 'lcm-save-btn ui-control plain icon fas fa-satellite-dish';
        btn.setAttribute('data-tooltip', tooltipText);
        btn.setAttribute('aria-label', tooltipText);
        btn.setAttribute('data-action', 'openCommunicatorLog'); 
        btn.title = tooltipText; 
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            Dnd5eCommunicator.openSaveMessagesDialog();
        });


        liItem.appendChild(btn);

        menuEl.prepend(liItem); 
        
        debug('Log button injected into menu.flexcol');
    } catch (err) {
        console.warn('D&D 5e Communicator | Could not inject log button:', err);
    }
}

// ─── Hooks: inject after sidebar renders ────────────────────────

Hooks.on('renderSidebar', () => _injectLogButton());
Hooks.on('renderSidebarTab', () => _injectLogButton());

// ─── Кнопка коммуникатора на листе dnd5e-актёра ─────────────────

/**
 * Добавляет кнопку коммуникатора в заголовок листа dnd5e-актёра.
 * При нажатии открывает диалог отправки сообщения, уже подставив
 * реальные имя и портрет ЭТОГО актёра (system.js читает их из
 * настоящего документа Actor, а не только из последнего
 * использованного значения/выбранного на сцене токена).
 * @param {ActorSheet|ApplicationV2} app - Экземпляр листа актёра
 */
function _injectActorSheetButton(app) {
    try {
        // Активна только в мирах на системе dnd5e — в остальных системах
        // модуль по-прежнему работает как раньше (кнопка токен-тулбара,
        // /lcm), просто без этой конкретной интеграции.
        if (game.system?.id !== 'dnd5e') return;

        const allowPlayersAccess = game.settings.get(MODULE_NAME, 'allowPlayersAccess');
        if (!game.user.isGM && !allowPlayersAccess) return;

        const actor = app?.actor ?? app?.document;
        if (!actor || actor.documentName !== 'Actor') return;

        // ApplicationV2 (dnd5e v4, AppV2-листы) отдаёт app.element как
        // обычный HTMLElement; классические V1 ActorSheet — как jQuery.
        const root = app.element instanceof HTMLElement ? app.element : app.element?.[0];
        if (!root) return;

        const header = root.querySelector('.window-header');
        if (!header) return;

        // Идемпотентность: при повторном рендере листа (например, после
        // update()) не плодим повторные кнопки в одном и том же заголовке.
        if (header.querySelector('.dnd5e-communicator-sheet-btn')) return;

        const tooltipText = game.i18n.localize('DNDCOM.Settings.Communicator') || 'D&D 5e Communicator';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'header-control dnd5e-communicator-sheet-btn icon fas fa-satellite-dish';
        btn.setAttribute('data-tooltip', tooltipText);
        btn.setAttribute('aria-label', tooltipText);
        btn.title = tooltipText;

        btn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            debug('Actor sheet button clicked', actor?.name);
            Dnd5eCommunicator.openCommunicatorSettings({ actor });
        });

        // Вставляем перед кнопкой закрытия окна — там, где Foundry обычно
        // располагает свои собственные header-control кнопки.
        const closeBtn = header.querySelector(
            'button[data-action="close"], .header-control.icon.fa-times, .header-control.icon.fa-xmark'
        );
        if (closeBtn) {
            closeBtn.insertAdjacentElement('beforebegin', btn);
        } else {
            header.appendChild(btn);
        }

        debug('Actor sheet button injected', { actor: actor?.name, sheet: app?.constructor?.name });
    } catch (err) {
        console.warn('D&D 5e Communicator | Could not inject actor sheet button:', err);
    }
}

// Foundry v13 диспетчеризует хуки рендера по всей цепочке классов
// приложения — для AppV2-листов dnd5e (v4+) реально стреляет
// 'renderActorSheetV2', а не системный 'renderActorSheet5e'.
Hooks.on('renderActorSheetV2', (app) => _injectActorSheetButton(app));
// Резерв для миров на dnd5e v3 (классические, jQuery-based ActorSheet).
Hooks.on('renderActorSheet5eCharacter', (app) => _injectActorSheetButton(app));
Hooks.on('renderActorSheet5eNPC', (app) => _injectActorSheetButton(app));
Hooks.on('renderActorSheet5eVehicle', (app) => _injectActorSheetButton(app));

