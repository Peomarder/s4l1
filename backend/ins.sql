-- 1. Вставка в таблицу user_privileges (Привилегии)
INSERT INTO user_privileges (name, description) 
VALUES 
('Администратор', 'Полные права доступа'),
('Аудитор', 'Просмотр журналов и отчетов'),
('Оператор', 'Ограниченные операционные права');

-- 2. Вставка в таблицу users (Пользователи)
INSERT INTO users (id_privilege, name, password, email, login) 
VALUES 
(1, 'Иванов А.С.', 'hash_ivanov', 'ivanov@example.com', 'ivanov_admin'),
(2, 'Петрова М.К.', 'hash_petrova', 'petrova@example.com', 'auditor_mp'),
(3, 'Сидоров В.П.', 'hash_sidorov', 'sidorov@example.com', 'operator_vs');

-- 3. Вставка в таблицу actions (Действия)
INSERT INTO actions (name, description) 
VALUES 
('Вход в систему', 'Успешная аутентификация'),
('Смена состояния замка', 'Смена состояния замка'),
('Создание замка', 'Создание замка');

-- 4. Вставка в таблицу locks (Замки)
INSERT INTO locks (id_privilege, is_open) 
VALUES 
(1, TRUE),
(2, FALSE),
(3, TRUE);

-- 5. Вставка в таблицу log_entries (Записи журнала)
INSERT INTO log_entries (id_user, id_action, id_lock) 
VALUES 
(1, 1, 1),
(2, 2, 2),
(3, 3, 3);

-- 6. Вставка в таблицу system_log (Системный журнал)
INSERT INTO system_log (id_action, affected_ip) 
VALUES 
(4, '192.168.1.10'),
(4, '10.0.0.15'),
(4, '172.16.0.20');

-- Проверка вставленных данных
SELECT * FROM user_privileges;
SELECT id_user, name, email, login FROM users;
SELECT * FROM actions;
SELECT id_lock, is_open, last_modified FROM locks;
SELECT id_log, id_user, id_action, timestamp FROM log_entries;
SELECT id_system_log, id_action, affected_ip, timestamp FROM system_log;