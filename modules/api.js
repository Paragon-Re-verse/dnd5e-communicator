import { Dnd5eCommunicator } from './communicator.js';

/**
 * Регистрирует публичное API модуля для доступа из макросов
 */
export function registerAPI() {
    game.modules.get('dnd5e-communicator').api = {
        /**
         * Открывает диалог настроек коммуникатора
         */
        openCommunicatorSettings: Dnd5eCommunicator.openCommunicatorSettings.bind(Dnd5eCommunicator),

        /**
         * Отправляет сообщение коммуникатора всем подключённым клиентам
         * @param {string} characterName - Имя персонажа
         * @param {string} portraitPath - Путь к изображению портрета
         * @param {string} message - Текст сообщения
         * @param {string} soundPath - Путь к звуковому файлу (опционально)
         * @param {string} voiceoverPath - Путь к файлу озвучки (опционально)
         * @param {string} style - Стиль сообщения (green, blue, yellow, red, damaged, undertale)
         * @param {number} fontSize - Размер шрифта в пикселях
         * @param {string|null} fontFamily - Семейство шрифта
         * @param {number|null} typingSpeed - Скорость печати (null = использовать глобальную)
         * @param {number|null} messageWidth - Ширина окна сообщения в процентах (20-90, null = глобальная)
         */
        sendCommunicatorMessage: Dnd5eCommunicator.sendCommunicatorMessage.bind(Dnd5eCommunicator),

        /**
         * Вычисляет скорость печати на основе длительности аудио и длины текста
         * @param {number} audioDuration - Длительность аудио в секундах
         * @param {number} textLength - Длина текста в символах
         * @returns {number} - Рекомендуемая скорость печати (50-180)
         */
        calculateTypingSpeedFromAudio: Dnd5eCommunicator._calculateTypingSpeedFromAudio.bind(Dnd5eCommunicator),

        /**
         * Получает длительность аудиофайла
         * @param {string} audioPath - Путь к аудиофайлу
         * @returns {Promise<number>} - Длительность в секундах
         */
        getAudioDuration: Dnd5eCommunicator._getAudioDuration.bind(Dnd5eCommunicator),

        /**
         * Выводит отладочное сообщение в консоль, если включен режим дебага
         * @param {string} message - Сообщение для вывода
         * @param {...any} args - Дополнительные аргументы
         */
        debug: Dnd5eCommunicator.debug.bind(Dnd5eCommunicator)
    };
}
