// types.ts

export interface Patient {
    _appointmentData: any;
    channelNo: any;
    id: string;
    nic: string;
    name: string;
    email: string;
    contact: string;
    age: string;
    channel: string;
    verifiedBy: string;
    doctor: string;
    time: string;
    date: string;
    address: string;
    fee: string;
    status: string;
}

export interface PatientAppointmentsProps {
    doctorName?: string;
    patients?: Patient[];
}

export interface PatientDetailsModalProps {
    patient: Patient | null;
    isOpen: boolean;
    onClose: () => void;
}
