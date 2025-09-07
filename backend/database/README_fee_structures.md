# Fee Structures (Semester Master) Sample Data

This directory contains sample data for the automatic fee assignment system in the School Management System.

## Files

### `sample_fee_structures.sql`
Contains comprehensive sample data for fee structures including:

## Fee Structure Types

### 1. Grade-Specific Fees (applies to all divisions in a grade)
- **Grade 1-5**: Primary school fees ranging from ₹6,000 to ₹8,600 total
- **Grade 6-8**: Middle school fees ranging from ₹11,100 to ₹12,600 total  
- **Grade 9-10**: High school fees ranging from ₹14,500 to ₹17,500 total

### 2. Division-Specific Fees
- **Grade 5 Division A**: Additional Science Lab Fee of ₹1,000

### 3. Universal Fees (applies to all students)
- **Transportation Fee**: ₹1,000
- **Security Fee**: ₹300
- **Development Fee**: ₹200

## Fee Categories Included

1. **Tuition Fee** - Core academic charges
2. **Library Fee** - Library usage and resources
3. **Activity Fee** - Extra-curricular activities
4. **Sports Fee** - Sports facilities and equipment
5. **Lab Fee** - Science/Computer laboratory usage
6. **Exam Fee** - Examination and assessment charges
7. **Transportation** - Bus/Transport facility
8. **Security Fee** - Campus security
9. **Development Fee** - Infrastructure development

## How It Works

When a student is created or their grade/division is changed, the system automatically:

1. **Searches for applicable fees** in this priority order:
   - Specific to student's grade and division
   - Specific to student's grade (all divisions)
   - Universal fees (all grades and divisions)

2. **Creates fee assignments** in `student_fee_assignments` table with:
   - Total amount from fee structure
   - Due date from fee structure
   - Status as 'pending'
   - Paid amount as 0.00

3. **For grade/division changes**: Cancels existing pending fees and assigns new ones

## Usage

1. **Run the sample data**:
   ```sql
   source /path/to/sample_fee_structures.sql
   ```

2. **Verify the data**:
   ```sql
   SELECT fs.*, fc.name as category_name, g.name as grade_name, d.name as division_name 
   FROM fee_structures fs 
   LEFT JOIN fee_categories fc ON fs.fee_category_id = fc.id
   LEFT JOIN grades g ON fs.grade_id = g.id  
   LEFT JOIN divisions d ON fs.division_id = d.id
   WHERE fs.is_active = 1
   ORDER BY fs.grade_id, fs.division_id, fc.name;
   ```

3. **Test automatic assignment**: Create a new student and check `student_fee_assignments` table

## Example Fee Totals by Grade

| Grade | Total Annual Fees |
|-------|-------------------|
| 1     | ₹7,500           |
| 2     | ₹8,100           |
| 3     | ₹8,800           |
| 4     | ₹9,400           |
| 5     | ₹10,100          |
| 5A    | ₹11,100 (with lab)|
| 6     | ₹12,600          |
| 7     | ₹13,300          |
| 8     | ₹14,100          |
| 9     | ₹16,000          |
| 10    | ₹19,000          |

*Note: All amounts include universal fees (Transportation + Security + Development = ₹1,500)*