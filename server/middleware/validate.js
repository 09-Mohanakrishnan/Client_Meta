export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    const message = error.errors ? error.errors.map((e) => e.message).join(', ') : error.message;
    return res.status(400).json({
      success: false,
      message,
    });
  }
};
