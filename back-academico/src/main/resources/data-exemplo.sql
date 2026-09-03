-- Script OPCIONAL com dados de exemplo.
-- Não é executado automaticamente (não se chama data.sql) para não conflitar
-- com o ddl-auto=update. Rode manualmente no PostgreSQL se quiser popular
-- o banco para testes/demonstração.

INSERT INTO disciplinas (nome, professor) VALUES
  ('Java', 'Prof. Carlos Andrade'),
  ('Banco de Dados', 'Profa. Renata Souza'),
  ('Redes', 'Prof. Marcelo Lima'),
  ('Web/Mobile', 'Profa. Juliana Ferreira'),
  ('Engenharia de Software', 'Prof. Eduardo Nogueira');

INSERT INTO horarios (disciplina_id, dia_semana, horario_inicio, horario_fim, sala)
SELECT id, 'Segunda-feira', '19:00', '20:40', 'Sala 12' FROM disciplinas WHERE nome = 'Java';
INSERT INTO horarios (disciplina_id, dia_semana, horario_inicio, horario_fim, sala)
SELECT id, 'Terça-feira', '19:00', '20:40', 'Sala 08' FROM disciplinas WHERE nome = 'Banco de Dados';
INSERT INTO horarios (disciplina_id, dia_semana, horario_inicio, horario_fim, sala)
SELECT id, 'Quarta-feira', '19:00', '20:40', 'Sala 05' FROM disciplinas WHERE nome = 'Redes';
INSERT INTO horarios (disciplina_id, dia_semana, horario_inicio, horario_fim, sala)
SELECT id, 'Quinta-feira', '19:00', '20:40', 'Sala 12' FROM disciplinas WHERE nome = 'Web/Mobile';
INSERT INTO horarios (disciplina_id, dia_semana, horario_inicio, horario_fim, sala)
SELECT id, 'Sexta-feira', '19:00', '20:40', 'Sala 03' FROM disciplinas WHERE nome = 'Engenharia de Software';

INSERT INTO avisos (titulo, descricao, disciplina_id, data_publicacao)
SELECT 'Prova de Banco de Dados', 'A prova será realizada na próxima aula.', id, '2026-08-28'
FROM disciplinas WHERE nome = 'Banco de Dados';
INSERT INTO avisos (titulo, descricao, disciplina_id, data_publicacao)
SELECT 'Entrega do trabalho de Java', 'Prazo final para envio do projeto do portal da turma.', id, '2026-09-16'
FROM disciplinas WHERE nome = 'Java';
