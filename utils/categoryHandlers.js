const categories = require("../models/category");
const subCategories = require("../models/subCategory");
const dbFunctions = require("./mongooseDbFunctions");

/**
 * Middleware to handle category/subcategory creation
 * Attaches created IDs to req.body for later use
 */
const handleCategories = async (req, res, next) => {
  try {
    const body = { ...req.body };

    // Handle Category Creation
    if (body.newCategory?._id) {
      const categoryResponse = await dbFunctions.insertOne(categories, body.newCategory);
      if (categoryResponse?.status === 'error') {
        return res.status(500).json(categoryResponse);
      }
      body.category = categoryResponse._id;
    }

    // Handle Subcategory Creation
    if (body.newSubCategory?._id) {
      const subCategoryResponse = await dbFunctions.insertOne(
        subCategories,
        {
          ...body.newSubCategory,
          category: body.newCategory?._id || body.category
        }
      );
      if (subCategoryResponse?.status === 'error') {
        return res.status(500).json(subCategoryResponse);
      }
      body.subCategory = subCategoryResponse._id;
    }

    // Attach processed body to the request
    req.body = body;
    next();
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = handleCategories;