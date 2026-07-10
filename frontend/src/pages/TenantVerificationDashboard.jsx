import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, FileText, CheckCircle, XCircle } from 'lucide-react';
import api, { BASE_URL } from '../services/api';
import toast from 'react-hot-toast';

const TenantVerificationDashboard = () => {
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchVerifications = async () => {
    try {
      const { data } = await api.get('/admin/pending-verifications');
      setPendingVerifications(data);
    } catch (_) {
      toast.error('Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleVerify = async (action) => {
    try {
      let remarks = '';
      if (action === 'reject') {
        remarks = prompt('Enter reason for rejection:');
        if (!remarks) return; // Cancelled
      }

      // Re-using verify-identity endpoint which updates profile_status
      await api.post('/admin/verify-identity', { studentId: selectedStudent.user_id, action, remarks });
      
      // If police status was submitted, also update that
      if (selectedStudent.police_status === 'submitted') {
         await api.post('/admin/verify-police', { studentId: selectedStudent.user_id, action, remarks });
      }

      toast.success(`Verification ${action}ed successfully`);
      
      setSelectedStudent(null);
      fetchVerifications();
    } catch (_) {
      toast.error(`Failed to ${action}`);
    }
  };

  // Filter to show all pending
  const displayedStudents = pendingVerifications.filter(s => s.profile_status === 'submitted' || s.police_status === 'submitted');

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-primary" /> Tenant Verification
          </h1>
          <p className="text-muted-foreground mt-1">Review student profiles and verify submitted details.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary mx-auto"></div></div>
      ) : displayedStudents.length === 0 ? (
        <div className="bg-card p-12 text-center rounded-2xl border">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <h2 className="text-xl font-bold">All Caught Up!</h2>
          <p className="text-muted-foreground">No pending verifications at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedStudents.map(student => (
            <motion.div key={student.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-6 border shadow-sm flex flex-col justify-between hover:border-primary/50 transition-colors">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-card-foreground">{student.name}</h3>
                    <p className="text-sm text-muted-foreground">{student.phone}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mb-4 space-y-1">
                  <p><strong>Status:</strong> {student.profile_status === 'submitted' ? 'Profile Review' : 'Police Review'}</p>
                  <p><strong>Email:</strong> {student.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudent(student)}
                className="w-full py-2 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
              >
                <FileText size={16} /> Review Details
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Verification Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card text-card-foreground rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border">
              <div className="p-6 border-b flex justify-between items-center bg-muted/30">
                <h2 className="text-2xl font-bold">
                  Verification - {selectedStudent.name}
                </h2>
                <button onClick={() => setSelectedStudent(null)} className="text-muted-foreground hover:text-foreground"><XCircle size={24} /></button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Student Details */}
                  <div className="space-y-6">
                    <h3 className="font-bold border-b pb-2">Guardian & Contact Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><p className="text-muted-foreground">Father's Phone</p><p className="font-medium">{selectedStudent.father_mobile || 'N/A'}</p></div>
                      <div><p className="text-muted-foreground">Mother's Phone</p><p className="font-medium">{selectedStudent.mother_mobile || 'N/A'}</p></div>
                    </div>
                  </div>

                  {/* Documents Display */}
                  <div className="space-y-6">
                    <h3 className="font-bold border-b pb-2">Police Verification</h3>
                    
                    {selectedStudent.police_status === 'submitted' ? (
                      <>
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">Police Station</p>
                          <p className="font-medium">{selectedStudent.police_station_name}</p>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">Verification Number</p>
                          <p className="font-medium">{selectedStudent.police_verification_number}</p>
                        </div>
                        <DocumentViewer label="Police Verification Document" url={selectedStudent.police_document} />
                      </>
                    ) : (
                      <p className="text-muted-foreground text-sm">No police verification submitted.</p>
                    )}
                  </div>

                </div>
              </div>

              <div className="p-6 border-t bg-muted/30 flex justify-end gap-4">
                <button onClick={() => handleVerify('reject')} className="px-6 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg font-bold transition-colors">
                  Reject & Request Update
                </button>
                <button onClick={() => handleVerify('approve')} className="px-6 py-2 bg-success text-success-foreground hover:bg-success/90 rounded-lg font-bold flex items-center gap-2 transition-colors">
                  <CheckCircle size={18} /> Approve Verification
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DocumentViewer = ({ label, url }) => {
  if (!url) return <div className="p-4 bg-muted rounded-lg text-muted-foreground text-sm">{label} not uploaded</div>;
  
  const isPdf = url.endsWith('.pdf');
  
  return (
    <div>
      <p className="font-medium text-sm mb-2">{label}</p>
      {isPdf ? (
        <a href={`${BASE_URL}${url}`} target="_blank" rel="noreferrer" className="block p-4 bg-primary/10 border border-primary/20 rounded-lg text-primary hover:underline font-medium">
          View PDF Document
        </a>
      ) : (
        <a href={`${BASE_URL}${url}`} target="_blank" rel="noreferrer">
          <img src={`${BASE_URL}${url}`} alt={label} className="w-full max-h-48 object-cover rounded-xl border shadow-sm hover:opacity-90 transition-opacity" />
        </a>
      )}
    </div>
  );
};

export default TenantVerificationDashboard;
