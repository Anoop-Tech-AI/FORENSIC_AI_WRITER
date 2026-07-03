const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
    /**
     * Create notification for specific users
     */
    static async createNotification(userIds, title, message, type, relatedCaseId = null) {
        try {
            if (!Array.isArray(userIds)) {
                userIds = [userIds];
            }

            const notifications = userIds.map(userId => ({
                userId,
                title,
                message,
                type,
                relatedCaseId,
                isRead: false,
                createdAt: new Date()
            }));

            const result = await Notification.insertMany(notifications);
            console.log(`Created ${notifications.length} notifications: ${title}`);
            return result;
        } catch (error) {
            console.error('Failed to create notifications:', error);
            throw error;
        }
    }

    /**
     * Create notification for all users with specific role
     */
    static async createNotificationForRole(role, title, message, type, relatedCaseId = null) {
        try {
            const users = await User.find({ role });
            const userIds = users.map(user => user._id);
            return await this.createNotification(userIds, title, message, type, relatedCaseId);
        } catch (error) {
            console.error(`Failed to create notifications for role ${role}:`, error);
            throw error;
        }
    }

    /**
     * Create notification for all admins
     */
    static async notifyAdmins(title, message, type, relatedCaseId = null) {
        return await this.createNotificationForRole('admin', title, message, type, relatedCaseId);
    }

    /**
     * Create notification for all investigators
     */
    static async notifyInvestigators(title, message, type, relatedCaseId = null) {
        return await this.createNotificationForRole('investigator', title, message, type, relatedCaseId);
    }

    /**
     * Create notification for all reporters
     */
    static async notifyReporters(title, message, type, relatedCaseId = null) {
        return await this.createNotificationForRole('reporter', title, message, type, relatedCaseId);
    }

    /**
     * Create notification for admins and investigators
     */
    static async notifyAdminsAndInvestigators(title, message, type, relatedCaseId = null) {
        try {
            const adminUsers = await User.find({ role: 'admin' });
            const investigatorUsers = await User.find({ role: 'investigator' });
            const allUsers = [...adminUsers, ...investigatorUsers];
            const userIds = allUsers.map(user => user._id);
            return await this.createNotification(userIds, title, message, type, relatedCaseId);
        } catch (error) {
            console.error('Failed to create notifications for admins and investigators:', error);
            throw error;
        }
    }

    /**
     * Create notification for case created
     */
    static async notifyCaseCreated(caseId, caseName, createdBy) {
        const title = 'New Case Created';
        const message = `Case ${caseId} (${caseName}) has been created by ${createdBy}`;
        return await this.notifyAdmins(title, message, 'case', caseId);
    }

    /**
     * Create notification for evidence uploaded
     */
    static async notifyEvidenceUploaded(caseId, evidenceCount, uploadedBy) {
        const title = 'Evidence Uploaded';
        const message = `${evidenceCount} evidence file(s) uploaded to case ${caseId} by ${uploadedBy}`;
        return await this.notifyAdminsAndInvestigators(title, message, 'evidence', caseId);
    }

    /**
     * Create notification for analysis started
     */
    static async notifyAnalysisStarted(caseId, caseName, startedBy) {
        const title = 'Analysis Started';
        const message = `AI analysis started for case ${caseId} (${caseName}) by ${startedBy}`;
        return await this.notifyAdminsAndInvestigators(title, message, 'evidence', caseId);
    }

    /**
     * Create notification for analysis completed
     */
    static async notifyAnalysisCompleted(caseId, caseName, completedBy) {
        const title = 'Analysis Completed';
        const message = `AI analysis completed for case ${caseId} (${caseName}) by ${completedBy}`;
        return await this.notifyReporters(title, message, 'report', caseId);
    }

    /**
     * Create notification for report generated
     */
    static async notifyReportGenerated(caseId, caseName, reportType, generatedBy) {
        const title = 'Report Generated';
        const message = `${reportType} report generated for case ${caseId} (${caseName}) by ${generatedBy}`;
        return await this.notifyAdmins(title, message, 'report', caseId);
    }

    /**
     * Create notification for case status updated
     */
    static async notifyCaseStatusUpdated(caseId, caseName, newStatus, updatedBy) {
        const title = 'Case Status Updated';
        const message = `Case ${caseId} (${caseName}) status updated to ${newStatus} by ${updatedBy}`;
        return await this.notifyAdminsAndInvestigators(title, message, 'case', caseId);
    }

    /**
     * Create system announcement
     */
    static async createSystemAnnouncement(title, message) {
        return await this.createNotificationForRole('admin', title, message, 'system');
    }

    /**
     * Broadcast system announcement to all users
     */
    static async broadcastSystemAnnouncement(title, message) {
        try {
            const allUsers = await User.find({});
            const userIds = allUsers.map(user => user._id);
            return await this.createNotification(userIds, title, message, 'system');
        } catch (error) {
            console.error('Failed to broadcast system announcement:', error);
            throw error;
        }
    }
}

module.exports = NotificationService;
