# ⚓ Расписание СПбГМТУ «Корабелка»

<div align="center">

[![CI](https://github.com/Cryptoteep/smtu-schedule/actions/workflows/ci.yml/badge.svg)](https://github.com/Cryptoteep/smtu-schedule/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/Cryptoteep/smtu-schedule/actions/workflows/deploy.yml/badge.svg)](https://github.com/Cryptoteep/smtu-schedule/actions/workflows/deploy.yml)
[![GitHub release](https://img.shields.io/github/v/release/Cryptoteep/smtu-schedule?color=e6a117&label=Релиз)](https://github.com/Cryptoteep/smtu-schedule/releases/latest)
[![License: MIT](https://img.shields.io/badge/Лицензия-MIT-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Capacitor](https://img.shields.io/badge/Capacitor-7.0-119EFF.svg?logo=capacitor&logoColor=white)](https://capacitorjs.com/)

**Современное кроссплатформенное приложение расписания для студентов и преподавателей Санкт-Петербургского государственного морского технического университета (СПбГМТУ).**

[🌐 Открыть веб-версию](https://cryptoteep.github.io/smtu-schedule/) • [📲 Страница загрузки (APK & PWA)](https://cryptoteep.github.io/smtu-schedule/download.html) • [📦 Релизы на GitHub](https://github.com/Cryptoteep/smtu-schedule/releases)

</div>

---

## ✨ Быстрый доступ и платформы

| Платформа | Формат | Ссылка / Способ установки |
| :--- | :--- | :--- |
| 🌐 **Веб-версия** | SPA (Vite + React 19) | [**Запустить онлайн на GitHub Pages**](https://cryptoteep.github.io/smtu-schedule/) |
| 📱 **Android** | Нативное приложение (APK) | [**Скачать APK с GitHub Releases**](https://github.com/Cryptoteep/smtu-schedule/releases/latest) |
| 🍏 **iOS (iPhone/iPad)** | PWA (Progressive Web App) | Откройте [онлайн-версию](https://cryptoteep.github.io/smtu-schedule/) в Safari → «Поделиться» → «На экран Домой» |
| 💻 **ПК (Win/Mac/Linux)** | Web Desktop + Hotkeys | В браузере (поддерживаются горячие клавиши `G`, `C`, `D`) |
| 📲 **Страница загрузки** | Интерактивный лендинг с QR | [**Открыть страницу загрузки**](https://cryptoteep.github.io/smtu-schedule/download.html) |

---

## 🚀 Основные возможности

1. **База данных всех факультетов Корабелки**:
   - 412 учебных групп по всем 8 факультетам:
     - **ФКиО** (Факультет кораблестроения и океанотехники)
     - **ФКИ** (Факультет корабельной энергетики и автоматики)
     - **ФЦТМТ** (Факультет цифровых промышленных технологий)
     - **ФГО** (Факультет гуманитарного образования)
     - **ИЭФ** (Инженерно-экономический факультет)
     - **ВФТШ** (Высшая физико-техническая школа)
     - **ИЛИСТ** / **ВУЦ** (Военный учебный центр)
     - **Колледж СПбГМТУ** (СТФ)
2. **Академический календарь и четность недель**:
   - Автоматический расчет текущей учебной недели и четности: **Верхняя (Числитель)** / **Нижняя (Знаменатель)**.
   - Фильтрация: *Текущая неделя*, *Числитель*, *Знаменатель*, *Все недели*.
3. **Таймер пар в реальном времени**:
   - Живой статус текущего занятия: *«Идёт пара (осталось 25 мин)»*, *«Перерыв (до пары 15 мин)»*.
4. **Справочник корпусов и аудиторий**:
   - Расшифровка литер корпусов СПбГМТУ:
     - **У** — Ульянка (Ленинский пр., 101)
     - **Л** — Лоцманская (ул. Лоцманская, 3)
     - **Г** — Горьковская (Кронверкский пр., 5)
     - **С** — Колледж (Ленинский пр., 101, стр. 4)
   - Встроенные ссылки на построение маршрута в Яндекс.Картах.
5. **Преподаватели**:
   - Просмотр преподавателя, карточки с фотографией, кафедры и аудиторий.
6. **Заметки и домашние задания**:
   - Персональные заметки, списки задач и дедлайны к конкретным парам с локальным сохранением.
7. **Экспорт в iCalendar (.ics)**:
   - Экспорт в 1 клик в Apple Calendar (iPhone/Mac), Google Calendar и Outlook с правильным повторением по четным/нечетным неделям.
8. **Автономность (Offline-First)**:
   - Полное кэширование расписания в браузере и на устройстве через Service Worker и LocalStorage. Приложение работает даже при отсутствии сети.

---

## 🏗 Архитектура проекта

```mermaid
flowchart TD
    subgraph Client["Клиентская часть"]
        UI["React 19 + Tailwind CSS"]
        Hooks["useSchedule / useNotes"]
        Services["WeekCalculator / Parser / CalendarExport"]
        Storage["Offline Storage (LocalStorage + SW Cache)"]
    end

    subgraph Targets["Платформы исполнения"]
        Web["GitHub Pages (PWA / Web App)"]
        Android["Capacitor Android (APK)"]
        iOS["iOS Safari WebClip (PWA)"]
    end

    subgraph Backend["Сетевой уровень"]
        Proxy["Express Proxy (server/server.ts)"]
        SMTU["Официальный портал rasp.smtu.ru"]
    end

    UI --> Hooks
    Hooks --> Services
    Services --> Storage
    UI --> Targets
    Hooks -.->|При наличии сети| Proxy
    Proxy --> SMTU
```

---

## 🛠 Технологический стек

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Мобильный рантайм**: Capacitor 7 (`@capacitor/android`, `@capacitor/core`).
- **Сетевой слой**: Node.js, Express, TSX, Fetch с кэшированием расписания.
- **Тестирование**: Vitest (покрытие парсера, расчета четности недель, экспорта в iCal и хранилища).
- **CI/CD**: GitHub Actions (автоматическая сборка, тестирование, публикация на GitHub Pages и сборка Android APK).

---

## ⚡ Быстрый старт для разработчиков

### 1. Клонирование и установка
```bash
git clone https://github.com/Cryptoteep/smtu-schedule.git
cd smtu-schedule
npm install
```

### 2. Запуск автоматических тестов
```bash
npm test
```

### 3. Запуск веб-версии
```bash
# В первом терминале (Express прокси кэша расписания):
npm run server

# Во втором терминале (Vite dev-сервер):
npm run dev
```

### 4. Сборка для Android
```bash
npm run build
npx cap sync android
npx cap open android
```

---

## 📜 Лицензия

Проект распространяется под свободной лицензией **MIT**. Подробнее см. в файле [LICENSE](LICENSE).
Разработано для студентов и преподавателей СПбГМТУ «Корабелка».
