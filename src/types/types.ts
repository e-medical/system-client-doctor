export interface DrugDetail {
    brandName: string;
    drugName: string;
    frequency: string;
    strength: string;
    dosage: string;
    duration: string;
    issueQty: number;
}

export interface Patient {
    name: string;
    doctor: string;
    date: string;
    time: string;
    nic: string;
    age: string;
    email: string;
    contact: string;
    address: string;
    issuedBy: string;
    prescriptionId: string;
    channelNumber: string;
    channelFee: string;
    issueTime: string;
    drugs: DrugDetail[];
    status: string;
}
