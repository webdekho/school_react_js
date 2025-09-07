// JavaScript type definitions using JSDoc comments

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} name
 * @property {string} mobile
 * @property {string} [email]
 * @property {'admin'|'staff'|'parent'} user_type
 * @property {number} [role_id]
 * @property {string} [role_name]
 * @property {string[]} [permissions]
 */

/**
 * @typedef {Object} AuthResponse
 * @property {string} status
 * @property {string} message
 * @property {Object} data
 * @property {string} data.token
 * @property {User} data.user
 */

/**
 * @typedef {Object} ApiResponse
 * @property {'success'|'error'} status
 * @property {string} message
 * @property {*} [data]
 * @property {Object} [errors]
 */

/**
 * @typedef {Object} Grade
 * @property {number} id
 * @property {string} name
 * @property {string} [description]
 * @property {number} division_count
 * @property {number} student_count
 * @property {boolean} is_active
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Division
 * @property {number} id
 * @property {number} grade_id
 * @property {string} grade_name
 * @property {string} name
 * @property {number} capacity
 * @property {number} student_count
 * @property {boolean} is_active
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Student
 * @property {number} id
 * @property {string} student_name
 * @property {number} grade_id
 * @property {string} grade_name
 * @property {number} division_id
 * @property {string} division_name
 * @property {string} roll_number
 * @property {string} [aadhaar_masked]
 * @property {string} [residential_address]
 * @property {string} [pincode]
 * @property {string} [sam_samagrah_id]
 * @property {string} [aapar_id]
 * @property {string} admission_date
 * @property {number} total_fees
 * @property {number} parent_id
 * @property {string} parent_name
 * @property {string} parent_mobile
 * @property {boolean} is_active
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Parent
 * @property {number} id
 * @property {string} name
 * @property {string} mobile
 * @property {string} [address]
 * @property {string} [pincode]
 * @property {string} [email]
 * @property {number} student_count
 * @property {boolean} is_active
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Staff
 * @property {number} id
 * @property {string} name
 * @property {string} mobile
 * @property {string} [email]
 * @property {string} [address]
 * @property {string} [pincode]
 * @property {number} role_id
 * @property {string} role_name
 * @property {string[]} [permissions]
 * @property {Grade[]} [assigned_grades]
 * @property {Division[]} [assigned_divisions]
 * @property {boolean} is_active
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} FeeType
 * @property {number} id
 * @property {string} name
 * @property {string} [description]
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} FeeCollection
 * @property {number} id
 * @property {number} student_id
 * @property {number} fee_type_id
 * @property {number} amount
 * @property {string} collection_date
 * @property {number} collected_by
 * @property {'cash'|'online'|'cheque'|'dd'} payment_method
 * @property {string} receipt_number
 * @property {string} [remarks]
 * @property {'pending'|'collected'|'cancelled'} status
 */

/**
 * @typedef {Object} DashboardStats
 * @property {number} total_students
 * @property {number} total_staff
 * @property {Object} fees_pending
 * @property {number} fees_pending.pending_count
 * @property {number} fees_pending.pending_amount
 * @property {Array} recent_activities
 * @property {Object} complaints_summary
 */

/**
 * @typedef {Object} LoginFormData
 * @property {string} mobile
 * @property {string} password
 * @property {'admin'|'staff'|'parent'} user_type
 */

/**
 * @typedef {Object} CreateStudentFormData
 * @property {string} student_name
 * @property {number} grade_id
 * @property {number} division_id
 * @property {string} roll_number
 * @property {string} [aadhaar]
 * @property {string} [residential_address]
 * @property {string} [pincode]
 * @property {string} [sam_samagrah_id]
 * @property {string} [aapar_id]
 * @property {string} admission_date
 * @property {number} total_fees
 * @property {number} parent_id
 */

/**
 * @typedef {Object} CreateParentFormData
 * @property {string} name
 * @property {string} mobile
 * @property {string} [address]
 * @property {string} [pincode]
 * @property {string} [email]
 * @property {string} password
 */

/**
 * @typedef {Object} CreateStaffFormData
 * @property {string} name
 * @property {string} mobile
 * @property {string} [email]
 * @property {string} [address]
 * @property {string} [pincode]
 * @property {number} role_id
 * @property {string} password
 * @property {number[]} [grades]
 * @property {number[]} [divisions]
 */

// Export empty object since this is just for type definitions
export default {};