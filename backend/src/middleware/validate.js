function validateBody(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    req.validatedBody = parsed.data;
    return next();
  };
}

function validateParams(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    req.validatedParams = parsed.data;
    return next();
  };
}

module.exports = { validateBody, validateParams };
