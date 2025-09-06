// Healthcare Platform JavaScript

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Main app initialization
function initializeApp() {
    // Initialize tooltips
    initializeTooltips();
    
    // Initialize form validation
    initializeFormValidation();
    
    // Initialize date pickers
    initializeDatePickers();
    
    // Initialize charts if present
    initializeCharts();
    
    // Initialize real-time features
    initializeRealTimeFeatures();
    
    // Initialize accessibility features
    initializeAccessibility();
}

// Initialize Bootstrap tooltips
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Form validation and enhancement
function initializeFormValidation() {
    // Custom validation for health prediction form
    const healthForm = document.getElementById('health-prediction-form');
    if (healthForm) {
        healthForm.addEventListener('submit', function(e) {
            if (!validateHealthForm()) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }
    
    // Real-time BMI calculation
    const bmiInput = document.getElementById('bmi');
    if (bmiInput) {
        addBMICalculator();
    }
    
    // Password strength indicator
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        if (input.name === 'password') {
            addPasswordStrengthIndicator(input);
        }
    });
}

// BMI Calculator
function addBMICalculator() {
    const bmiInput = document.getElementById('bmi');
    const heightInput = document.createElement('input');
    const weightInput = document.createElement('input');
    
    heightInput.type = 'number';
    heightInput.placeholder = 'Height (cm)';
    heightInput.className = 'form-control mb-2';
    heightInput.step = '0.1';
    
    weightInput.type = 'number';
    weightInput.placeholder = 'Weight (kg)';
    weightInput.className = 'form-control mb-2';
    weightInput.step = '0.1';
    
    const calculateBtn = document.createElement('button');
    calculateBtn.type = 'button';
    calculateBtn.className = 'btn btn-outline-primary btn-sm';
    calculateBtn.innerHTML = '<i class="fas fa-calculator"></i> Calculate BMI';
    
    const bmiContainer = document.createElement('div');
    bmiContainer.className = 'bmi-calculator mt-2';
    bmiContainer.appendChild(heightInput);
    bmiContainer.appendChild(weightInput);
    bmiContainer.appendChild(calculateBtn);
    
    bmiInput.parentNode.insertBefore(bmiContainer, bmiInput.nextSibling);
    
    calculateBtn.addEventListener('click', function() {
        const height = parseFloat(heightInput.value) / 100; // Convert to meters
        const weight = parseFloat(weightInput.value);
        
        if (height > 0 && weight > 0) {
            const bmi = weight / (height * height);
            bmiInput.value = bmi.toFixed(1);
            
            // Show BMI category
            const category = getBMICategory(bmi);
            showBMICategory(category, bmi);
        }
    });
}

// Get BMI category
function getBMICategory(bmi) {
    if (bmi < 18.5) return { category: 'Underweight', color: 'info' };
    if (bmi < 25) return { category: 'Normal weight', color: 'success' };
    if (bmi < 30) return { category: 'Overweight', color: 'warning' };
    return { category: 'Obese', color: 'danger' };
}

// Show BMI category
function showBMICategory(categoryInfo, bmi) {
    const existingAlert = document.querySelector('.bmi-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${categoryInfo.color} bmi-alert mt-2`;
    alert.innerHTML = `
        <i class="fas fa-info-circle me-2"></i>
        BMI: ${bmi.toFixed(1)} - ${categoryInfo.category}
    `;
    
    const bmiInput = document.getElementById('bmi');
    bmiInput.parentNode.appendChild(alert);
}

// Password strength indicator
function addPasswordStrengthIndicator(input) {
    const strengthMeter = document.createElement('div');
    strengthMeter.className = 'password-strength-meter mt-2';
    strengthMeter.innerHTML = `
        <div class="progress" style="height: 5px;">
            <div class="progress-bar" role="progressbar" style="width: 0%"></div>
        </div>
        <small class="text-muted">Password strength: <span class="strength-text">Very weak</span></small>
    `;
    
    input.parentNode.appendChild(strengthMeter);
    
    input.addEventListener('input', function() {
        const strength = calculatePasswordStrength(input.value);
        updatePasswordStrengthMeter(strengthMeter, strength);
    });
}

// Calculate password strength
function calculatePasswordStrength(password) {
    let score = 0;
    
    // Length
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    
    // Character types
    if (/[a-z]/.test(password)) score += 20;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[0-9]/.test(password)) score += 20;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;
    
    // Bonus for variety
    if (password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
        score += 10;
    }
    
    return Math.min(100, score);
}

// Update password strength meter
function updatePasswordStrengthMeter(meter, strength) {
    const progressBar = meter.querySelector('.progress-bar');
    const strengthText = meter.querySelector('.strength-text');
    
    let color, text;
    
    if (strength < 25) {
        color = 'danger';
        text = 'Very weak';
    } else if (strength < 50) {
        color = 'warning';
        text = 'Weak';
    } else if (strength < 75) {
        color = 'info';
        text = 'Good';
    } else {
        color = 'success';
        text = 'Strong';
    }
    
    progressBar.style.width = strength + '%';
    progressBar.className = `progress-bar bg-${color}`;
    strengthText.textContent = text;
    strengthText.className = `strength-text text-${color}`;
}

// Initialize date pickers
function initializeDatePickers() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        // Set minimum date for appointment booking
        if (input.name === 'appointment_date') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            input.min = tomorrow.toISOString().split('T')[0];
        }
    });
}

// Initialize charts (if Chart.js is available)
function initializeCharts() {
    // Health trend chart
    const healthChartCanvas = document.getElementById('healthTrendChart');
    if (healthChartCanvas && typeof Chart !== 'undefined') {
        createHealthTrendChart(healthChartCanvas);
    }
    
    // Risk distribution chart
    const riskChartCanvas = document.getElementById('riskDistributionChart');
    if (riskChartCanvas && typeof Chart !== 'undefined') {
        createRiskDistributionChart(riskChartCanvas);
    }
}

// Create health trend chart
function createHealthTrendChart(canvas) {
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Health Score',
                data: [65, 70, 75, 80, 85, 90],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Create risk distribution chart
function createRiskDistributionChart(canvas) {
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Low Risk', 'Medium Risk', 'High Risk'],
            datasets: [{
                data: [60, 30, 10],
                backgroundColor: [
                    '#28a745',
                    '#ffc107',
                    '#dc3545'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Initialize real-time features
function initializeRealTimeFeatures() {
    // Auto-refresh notifications
    setInterval(checkForNotifications, 30000); // Check every 30 seconds
    
    // Auto-save form data
    initializeAutoSave();
    
    // Real-time chat updates
    initializeChatUpdates();
}

// Check for notifications
function checkForNotifications() {
    // This would typically make an AJAX call to check for new notifications
    // For now, we'll just update the UI elements
    updateNotificationBadges();
}

// Update notification badges
function updateNotificationBadges() {
    const badges = document.querySelectorAll('.notification-badge');
    badges.forEach(badge => {
        // Update badge count based on new notifications
        // This would be populated from actual data
    });
}

// Initialize auto-save for forms
function initializeAutoSave() {
    const forms = document.querySelectorAll('form[data-autosave]');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', debounce(function() {
                saveFormData(form);
            }, 1000));
        });
    });
}

// Save form data to localStorage
function saveFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    localStorage.setItem(`form_${form.id}`, JSON.stringify(data));
}

// Load saved form data
function loadFormData(formId) {
    const savedData = localStorage.getItem(`form_${formId}`);
    if (savedData) {
        const data = JSON.parse(savedData);
        const form = document.getElementById(formId);
        
        if (form) {
            Object.keys(data).forEach(key => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) {
                    input.value = data[key];
                }
            });
        }
    }
}

// Initialize chat updates
function initializeChatUpdates() {
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
        // Auto-scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Check for new messages periodically
        setInterval(function() {
            // This would typically fetch new messages via AJAX
            // For now, we'll just ensure scroll position is maintained
            maintainChatScroll();
        }, 5000);
    }
}

// Maintain chat scroll position
function maintainChatScroll() {
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
        const isScrolledToBottom = chatContainer.scrollHeight - chatContainer.clientHeight <= chatContainer.scrollTop + 1;
        
        if (isScrolledToBottom) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }
}

// Initialize accessibility features
function initializeAccessibility() {
    // Add keyboard navigation
    initializeKeyboardNavigation();
    
    // Add aria labels
    addAriaLabels();
    
    // Initialize focus management
    initializeFocusManagement();
}

// Initialize keyboard navigation
function initializeKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        // ESC key to close modals
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                if (modalInstance) {
                    modalInstance.hide();
                }
            });
        }
        
        // Enter key to submit forms
        if (e.key === 'Enter' && e.target.tagName === 'BUTTON') {
            e.target.click();
        }
    });
}

// Add aria labels for accessibility
function addAriaLabels() {
    // Add labels to buttons without text
    const iconButtons = document.querySelectorAll('button:not([aria-label])');
    iconButtons.forEach(button => {
        const icon = button.querySelector('i[class*="fa-"]');
        if (icon) {
            const iconClass = icon.className.match(/fa-[\w-]+/);
            if (iconClass) {
                const label = getAriaLabelFromIcon(iconClass[0]);
                if (label) {
                    button.setAttribute('aria-label', label);
                }
            }
        }
    });
}

// Get aria label from icon class
function getAriaLabelFromIcon(iconClass) {
    const iconLabels = {
        'fa-edit': 'Edit',
        'fa-delete': 'Delete',
        'fa-trash': 'Delete',
        'fa-plus': 'Add',
        'fa-minus': 'Remove',
        'fa-search': 'Search',
        'fa-close': 'Close',
        'fa-times': 'Close',
        'fa-check': 'Confirm',
        'fa-save': 'Save',
        'fa-print': 'Print',
        'fa-download': 'Download',
        'fa-upload': 'Upload',
        'fa-refresh': 'Refresh',
        'fa-home': 'Home',
        'fa-user': 'User',
        'fa-settings': 'Settings',
        'fa-help': 'Help',
        'fa-info': 'Information'
    };
    
    return iconLabels[iconClass] || null;
}

// Initialize focus management
function initializeFocusManagement() {
    // Focus first input in forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const firstInput = form.querySelector('input:not([type="hidden"]), textarea, select');
        if (firstInput) {
            firstInput.focus();
        }
    });
    
    // Manage focus in modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('shown.bs.modal', function() {
            const firstInput = modal.querySelector('input:not([type="hidden"]), textarea, select, button');
            if (firstInput) {
                firstInput.focus();
            }
        });
    });
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showLoading(element) {
    element.innerHTML = '<div class="spinner"></div>';
}

function hideLoading(element, originalContent) {
    element.innerHTML = originalContent;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show notification-toast`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
    `;
    
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Health form validation
function validateHealthForm() {
    const requiredFields = ['age', 'gender', 'smoking', 'alcohol', 'exercise', 'diet', 'sleep_hours', 'stress_level', 'bmi', 'blood_pressure', 'family_history'];
    let isValid = true;
    
    requiredFields.forEach(fieldName => {
        const field = document.getElementsByName(fieldName)[0];
        if (field && !field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else if (field) {
            field.classList.remove('is-invalid');
        }
    });
    
    return isValid;
}

// Export functions for external use
window.HealthcarePlatform = {
    showNotification,
    showLoading,
    hideLoading,
    validateHealthForm,
    calculatePasswordStrength,
    getBMICategory
};
