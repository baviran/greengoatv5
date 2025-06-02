export type FieldChoice = {
    id: string;
    name: string;
    color: string;
};

export type FieldOption = {
    choices?: FieldChoice[];
    isReversed?: boolean;
};

export type FieldType = 'singleLineText' | 'multilineText' | 'multipleSelects' | 'multipleAttachments';

export type TableField = {
    type: FieldType;
    id: string;
    name: string;
    options?: FieldOption;
};

export type TableView = {
    id: string;
    name: string;
    type: string;
};

export type TableSchema = {
    id: string;
    name: string;
    primaryFieldId: string;
    fields: TableField[];
    views: TableView[];
};

export type AirtableSchema = {
    tables: TableSchema[];
};