export type ISponsor ={
  _id: string;
  name: { 
    en: string; 
    th: string 
  };
  photo: {
    logoPhoto: string;
  };
  type: {
    _id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  };
  isShow: boolean;
  createdAt: string;
  updatedAt: string;
  budget?: string;
  no?: number;
}

export type ISponsorResponse ={
  data: ISponsor[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    lastUpdatedAt: string;
  };
  message: string;
}