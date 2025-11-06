# Semester-Based Fee Management System

This system implements automatic semester-based fee assignment where fees are defined in the Semester Master (fee_structures table) for each Grade, Division, and Semester combination.

## Database Changes

### 1. Fee Structures Table Updates
- **File**: `update_fee_structures_for_semesters.sql`
- **Changes**: 
  - Added `semester` ENUM field ('Semester 1', 'Semester 2')
  - Added index for better query performance
  - Updated existing records to default to 'Semester 1'

### 2. Student Fee Assignments Table Updates
- **File**: `update_student_fee_assignments_for_semesters.sql`
- **Changes**:
  - Added `semester` field to track which semester each fee assignment belongs to
  - Added index for better query performance on semester-based queries

## How It Works

### Student Creation Process
1. **Automatic Fee Assignment**: When a student is created, the system:
   - Fetches all applicable fee structures for **Semester 1** based on student's grade/division
   - Fetches all applicable fee structures for **Semester 2** based on student's grade/division
   - Creates fee assignments in `student_fee_assignments` table for both semesters
   - Each assignment includes semester information, amounts, due dates, and status

### Fee Structure Priority
The system searches for applicable fees in this order:
1. **Grade + Division specific** fees
2. **Grade specific** fees (applies to all divisions in that grade)
3. **Universal fees** (applies to all students regardless of grade/division)

### Student Updates
When a student's grade or division changes:
1. **Cancellation**: Existing pending fee assignments are marked as 'cancelled'
2. **Reassignment**: New fees for both semesters are automatically assigned based on the new grade/division

## Sample Data Structure

### Semester-Based Fee Examples

| Grade | Semester | Category | Amount | Due Date |
|-------|----------|----------|---------|----------|
| 1     | Semester 1 | Tuition Fee | ₹2,500 | 2024-06-15 |
| 1     | Semester 2 | Tuition Fee | ₹2,500 | 2024-12-15 |
| 5     | Semester 1 | Tuition Fee | ₹3,500 | 2024-06-15 |
| 5     | Semester 2 | Tuition Fee | ₹3,500 | 2024-12-15 |
| 10    | Semester 1 | Board Exam Fee | ₹750 | 2024-06-15 |
| 10    | Semester 2 | Board Exam Fee | ₹750 | 2024-12-15 |

### Division-Specific Fees
- **Grade 5 Division A**: Additional Science Lab Fee of ₹500 for both semesters

### Universal Fees (All Students)
- **Transportation**: ₹500 per semester
- **Security**: ₹150 per semester  
- **Development**: ₹100 per semester

## Total Fee Breakdown by Grade (Per Semester)

| Grade | Semester 1 Total | Semester 2 Total | Annual Total |
|-------|------------------|------------------|--------------|
| 1     | ₹3,750          | ₹3,750          | ₹7,500      |
| 2     | ₹4,050          | ₹4,050          | ₹8,100      |
| 3     | ₹4,400          | ₹4,400          | ₹8,800      |
| 4     | ₹4,700          | ₹4,700          | ₹9,400      |
| 5     | ₹5,050          | ₹5,050          | ₹10,100     |
| 5A    | ₹5,550          | ₹5,550          | ₹11,100     |
| 6     | ₹6,300          | ₹6,300          | ₹12,600     |
| 7     | ₹6,650          | ₹6,650          | ₹13,300     |
| 8     | ₹7,050          | ₹7,050          | ₹14,100     |
| 9     | ₹8,000          | ₹8,000          | ₹16,000     |
| 10    | ₹9,500          | ₹9,500          | ₹19,000     |

*Note: All amounts include universal fees (Transportation + Security + Development = ₹750 per semester)*

## Implementation Files

### Database Schema Updates
1. **`update_fee_structures_for_semesters.sql`** - Adds semester field to fee_structures
2. **`update_student_fee_assignments_for_semesters.sql`** - Adds semester field to assignments
3. **`semester_based_fee_structures.sql`** - Complete sample data for all grades and semesters

### Backend Logic Updates
**`Student_model.php`** modifications:
- `assign_fees_to_student()` - Now assigns both Semester 1 and Semester 2 fees
- `assign_semester_fees()` - New method to assign fees for a specific semester
- `reassign_fees_to_student()` - Cancels existing fees and reassigns for both semesters

## Usage Instructions

1. **Run Database Updates** (in order):
   ```sql
   source update_fee_structures_for_semesters.sql
   source update_student_fee_assignments_for_semesters.sql
   source semester_based_fee_structures.sql
   ```

2. **Verify Implementation**:
   - Create a new student
   - Check `student_fee_assignments` table for both Semester 1 and Semester 2 entries
   - Verify amounts match the fee structures for the student's grade/division

3. **Test Grade/Division Changes**:
   - Update a student's grade or division
   - Verify old fees are cancelled and new fees are assigned for both semesters

## Fee Collection Integration
The semester-based fee assignments can be used for:
- **Semester 1 Collections**: Query assignments with `semester = 'Semester 1'`
- **Semester 2 Collections**: Query assignments with `semester = 'Semester 2'`
- **Payment Processing**: Update `paid_amount` and `pending_amount` in assignments
- **Fee Reports**: Generate semester-wise fee reports and outstanding balances