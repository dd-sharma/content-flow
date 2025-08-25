// Configuration for content review assignment rules
export const REVIEWER_RULES = {
    blog_post: ["brand_manager"],
    social_media_post: ["brand_manager"],
    email_campaign: ["brand_manager", "compliance"],
    ad_creative: ["brand_manager"],
    press_release: ["brand_manager", "legal_team"],
    custom: ["brand_manager"] // Default for custom content types
};

export const SPECIAL_RULES = {
    highSpendThreshold: 10000,
    requiresLegalForCompetitors: true,
    adminAlwaysIncluded: true,
    urgentPriorityEscalation: ["cmo"] // Additional reviewers for urgent items
};

// Function to get reviewers based on content properties
export const getReviewersForContent = async (content, allUsers = []) => {
    const reviewerEmails = new Set();
    
    // Get base reviewers for content type
    const baseReviewers = REVIEWER_RULES[content.content_type] || REVIEWER_RULES.custom;
    
    // Find users with matching roles
    baseReviewers.forEach(role => {
        const usersWithRole = allUsers.filter(user => user.user_role === role);
        usersWithRole.forEach(user => reviewerEmails.add(user.email));
    });
    
    // Apply special rules
    if (content.mentions_competitors && SPECIAL_RULES.requiresLegalForCompetitors) {
        const legalUsers = allUsers.filter(user => user.user_role === "legal_team");
        legalUsers.forEach(user => reviewerEmails.add(user.email));
    }
    
    if (content.estimated_spend > SPECIAL_RULES.highSpendThreshold) {
        const cmoUsers = allUsers.filter(user => user.user_role === "cmo");
        cmoUsers.forEach(user => reviewerEmails.add(user.email));
    }
    
    if (content.priority_level === "urgent") {
        const escalationUsers = allUsers.filter(user => 
            SPECIAL_RULES.urgentPriorityEscalation.includes(user.user_role)
        );
        escalationUsers.forEach(user => reviewerEmails.add(user.email));
    }
    
    // Admin always included if enabled
    if (SPECIAL_RULES.adminAlwaysIncluded) {
        const adminUsers = allUsers.filter(user => user.user_role === "admin");
        adminUsers.forEach(user => reviewerEmails.add(user.email));
    }
    
    return Array.from(reviewerEmails);
};

// Helper function to get role display name
export const getRoleDisplayName = (role) => {
    const roleNames = {
        content_creator: "Content Creator",
        brand_manager: "Brand Manager", 
        legal_team: "Legal Team",
        compliance: "Compliance",
        cmo: "CMO",
        admin: "Admin"
    };
    return roleNames[role] || role.replace(/_/g, " ");
};

// Get all available reviewer roles
export const getAvailableReviewerRoles = () => {
    return ["brand_manager", "legal_team", "compliance", "cmo", "admin"];
};