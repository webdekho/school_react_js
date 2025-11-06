# Dynamic Fields for Fee Structures

This feature adds item-specific fields to fee structures that appear dynamically based on the selected fee category.

## Implementation Overview

### Database Changes
- **Added to `fee_structures` table**:
  - `item_photo` VARCHAR(255) - Stores file path for uploaded photos (Bag items)
  - `item_size` VARCHAR(50) - Stores size information (Shoes/Uniform items)

### Dynamic Field Logic

#### 1. Photo Upload Field (Bag Items)
- **Appears when**: Fee category name contains "bag" (case-insensitive)
- **File types allowed**: JPG, PNG, GIF
- **Max file size**: 5MB
- **Upload location**: `uploads/fee_items/`
- **Filename format**: `item_[timestamp]_[uniqid].[extension]`

#### 2. Size Selection Field (Shoes/Uniform Items)
- **Appears when**: Fee category name contains "shoes" or "uniform" (case-insensitive)

**Shoe Sizes Available**:
- Size 5, 6, 7, 8, 9, 10, 11, 12

**Uniform Sizes Available**:
- XS (Extra Small)
- S (Small)
- M (Medium)
- L (Large)
- XL (Extra Large)
- XXL (Double Extra Large)

## How to Test

### 1. Test Photo Upload for Bag Items
1. Navigate to **Fee Structures Management**
2. Click **"Add New Structure"**
3. Select **"Bag"** as the fee category
4. Observe that a **"Bag Photo"** file upload field appears
5. Upload an image file and save
6. Verify the photo path is stored in the database

### 2. Test Size Selection for Shoes/Uniform Items
1. Click **"Add New Structure"**
2. Select **"Uniform/Shoes"** as the fee category
3. Observe that a **"Size"** dropdown field appears
4. For uniform-related items: Shows clothing sizes (XS, S, M, L, XL, XXL)
5. For shoe-related items: Shows shoe sizes (5-12)
6. Select a size and save
7. Verify the size is stored and displayed in the list

### 3. Verify Dynamic Behavior
1. **Category Change**: When changing fee category, the dynamic fields should appear/disappear
2. **Field Reset**: When switching categories, previous values in dynamic fields are cleared
3. **List Display**: The fee structures list shows size and photo indicators

## Frontend Components

### Form Fields
```jsx
// Photo upload field (shown for Bag items)
{shouldShowPhotoField() && (
  <Form.Control
    type="file"
    name="item_photo"
    accept="image/*"
    onChange={handleInputChange}
  />
)}

// Size selection field (shown for Shoes/Uniform items)
{shouldShowSizeField() && (
  <Form.Select
    name="item_size"
    value={formData.item_size}
    onChange={handleInputChange}
  >
    {getSizeOptions().map((size) => (
      <option key={size.value} value={size.value}>
        {size.label}
      </option>
    ))}
  </Form.Select>
)}
```

### Helper Functions
- `shouldShowPhotoField()` - Checks if category name contains "bag"
- `shouldShowSizeField()` - Checks if category name contains "shoes" or "uniform"
- `getSizeOptions()` - Returns appropriate size options based on category

## Backend API Changes

### POST/PUT `/api/admin/fee_structures`
- **New validation rule**: `item_size` (string, optional)
- **File handling**: Processes `item_photo` file upload
- **Upload validation**: File type, size, and security checks

### File Upload Method
```php
private function upload_item_photo($file) {
    // Validates file type (JPG, PNG, GIF)
    // Validates file size (max 5MB)
    // Creates unique filename
    // Moves file to uploads/fee_items/ directory
    // Returns success/error response
}
```

## Test Data Created

**Sample records have been inserted**:
- 2 Bag fee structures (Grade 1-2) - for photo upload testing
- 4 Uniform/Shoes fee structures (Grade 1-2) - for size selection testing
  - 2 with uniform sizes (S, M)
  - 2 with shoe sizes (6, 7)

## Usage Examples

### Creating a Bag Fee Structure
1. Select "Bag" category
2. Photo upload field appears
3. Upload bag image (JPG/PNG/GIF, max 5MB)
4. Fill other required fields and save

### Creating a Uniform Fee Structure
1. Select "Uniform/Shoes" category  
2. Size dropdown appears with clothing sizes
3. Select appropriate size (XS-XXL)
4. Fill other required fields and save

### Creating a Shoe Fee Structure
1. Select "Uniform/Shoes" category
2. Size dropdown appears with shoe sizes
3. Select appropriate size (5-12)
4. Fill other required fields and save

## File Structure
- **Frontend**: `/src/pages/admin/FeeStructuresManagement.js`
- **Backend**: `/application/controllers/api/Admin.php`
- **Database**: `/database/add_item_specific_fields.sql`
- **Uploads**: `/uploads/fee_items/` (auto-created)
- **Test Data**: `/database/test_dynamic_fields_fee_structures.sql`

The system automatically shows/hides the relevant fields based on the fee category selection, providing a clean and intuitive user experience.