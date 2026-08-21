export const validate = (schema) => async (req, res, next) => {
  try {
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params
    });
    req.body = parsed.body || req.body;
    req.query = parsed.query || req.query;
    req.params = parsed.params || req.params;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: error.errors?.map((err) => ({
        field: err.path.slice(1).join('.'),
        message: err.message
      })) || [{ message: error.message }]
    });
  }
};
