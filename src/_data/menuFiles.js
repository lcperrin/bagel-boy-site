const fs = require('fs');
const path = require('path');

module.exports = function () {
    // Use the correct path relative to the project root
    const menuDir = path.join(process.cwd(), 'src/assets/uploads/menu');
    const menuData = {};

    try {
        if (!fs.existsSync(menuDir)) {
            console.log('Menu directory does not exist:', menuDir);
            return {};
        }

        const items = fs.readdirSync(menuDir, { withFileTypes: true });

        items.forEach(item => {
            if (item.isDirectory()) {
                const categoryName = item.name;
                const categoryPath = path.join(menuDir, categoryName);

                // Read files in the subdirectory
                // Read items in the subdirectory
                const items = fs.readdirSync(categoryPath, { withFileTypes: true });
                const categoryItems = [];

                items.forEach(subItem => {
                    if (subItem.name.startsWith('.') || subItem.name === '.DS_Store') return;

                    if (subItem.isDirectory()) {
                        // It's a multi-image item folder
                        const subItemPath = path.join(categoryPath, subItem.name);
                        const images = fs.readdirSync(subItemPath)
                            .filter(f => !f.startsWith('.') && !f.endsWith('.DS_Store'))
                            .map(img => path.join(subItem.name, img)); // Relative path: folder/image.jpg

                        if (images.length > 0) {
                            categoryItems.push({
                                name: subItem.name,
                                images: images
                            });
                        }
                    } else {
                        // It's a single image file
                        categoryItems.push({
                            name: subItem.name,
                            images: [subItem.name]
                        });
                    }
                });

                if (categoryItems.length > 0) {
                    menuData[categoryName] = categoryItems;
                }
            }
        });

    } catch (err) {
        console.error('Error scanning menu directory:', err);
    }

    return menuData;
};
