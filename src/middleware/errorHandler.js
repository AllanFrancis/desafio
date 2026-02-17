const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Erro de multer (upload de arquivo)
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Arquivo muito grande. Tamanho máximo: 5MB",
      });
    }
    return res.status(400).json({
      success: false,
      message: "Erro no upload do arquivo",
      error: err.message,
    });
  }

  // Erro de tipo de arquivo
  if (err.message && err.message.includes("Apenas arquivos CSV")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Erro padrão
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Erro interno do servidor",
  });
};

module.exports = errorHandler;
