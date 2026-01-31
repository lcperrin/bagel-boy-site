module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "admin": "admin" });
  eleventyConfig.addFilter("byOrder", items => (items || []).sort((a, b) => (a.data.order || 0) - (b.data.order || 0)));
  eleventyConfig.addCollection("menuItems", c => c.getFilteredByGlob("src/menu-items/*.md").sort((a, b) => (a.data.order || 0) - (b.data.order || 0)));

  eleventyConfig.addFilter("formatMenuLink", filename => {
    if (!filename) return "";
    // Remove extension
    let name = filename.replace(/\.[^/.]+$/, "");
    // Replace underscores with spaces
    name = name.replace(/_/g, " ");
    // Title Case
    return name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  });

  return { dir: { input: "src", output: "dist", includes: "_includes" }, markdownTemplateEngine: "njk", htmlTemplateEngine: "njk", templateFormats: ["njk", "md", "html"] };
};