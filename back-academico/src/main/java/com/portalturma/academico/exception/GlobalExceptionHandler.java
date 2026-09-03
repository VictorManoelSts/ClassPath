package com.portalturma.academico.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> tratarNaoEncontrado(
            ResourceNotFoundException erro,
            HttpServletRequest request
    ) {
        return criarResposta(
                HttpStatus.NOT_FOUND,
                erro.getMessage(),
                request.getRequestURI()
        );
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<Map<String, Object>> tratarRegraDeNegocio(
            BusinessRuleException erro,
            HttpServletRequest request
    ) {
        return criarResposta(HttpStatus.BAD_REQUEST, erro.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler({ResourceConflictException.class, DataIntegrityViolationException.class})
    public ResponseEntity<Map<String, Object>> tratarConflito(
            Exception erro,
            HttpServletRequest request
    ) {
        String mensagem = erro instanceof ResourceConflictException
                ? erro.getMessage()
                : "A operação não pode ser realizada porque o registro está sendo utilizado";

        return criarResposta(HttpStatus.CONFLICT, mensagem, request.getRequestURI());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> tratarValidacao(
            MethodArgumentNotValidException erro,
            HttpServletRequest request
    ) {
        Map<String, String> campos = new LinkedHashMap<>();
        erro.getBindingResult().getFieldErrors().forEach(campo ->
                campos.putIfAbsent(campo.getField(), campo.getDefaultMessage())
        );

        Map<String, Object> resposta = corpoBase(
                HttpStatus.BAD_REQUEST,
                "Existem campos inválidos na requisição",
                request.getRequestURI()
        );
        resposta.put("campos", campos);
        return ResponseEntity.badRequest().body(resposta);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> tratarJsonInvalido(
            HttpMessageNotReadableException erro,
            HttpServletRequest request
    ) {
        return criarResposta(
                HttpStatus.BAD_REQUEST,
                "O JSON está inválido ou possui data/horário em formato incorreto",
                request.getRequestURI()
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> tratarErroGenerico(
            Exception erro,
            HttpServletRequest request
    ) {
        LOGGER.error(
                "Erro inesperado ao processar {}",
                request.getRequestURI(),
                erro
        );

        return criarResposta(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Erro interno no servidor",
                request.getRequestURI()
        );
    }

    private ResponseEntity<Map<String, Object>> criarResposta(
            HttpStatus status,
            String mensagem,
            String caminho
    ) {
        return ResponseEntity.status(status).body(corpoBase(status, mensagem, caminho));
    }

    private Map<String, Object> corpoBase(HttpStatus status, String mensagem, String caminho) {
        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("dataHora", LocalDateTime.now());
        resposta.put("status", status.value());
        resposta.put("erro", mensagem);
        resposta.put("caminho", caminho);
        return resposta;
    }
}
