export type StackItem = {
    name: string;
    icon: string;
    featured?: boolean;
};

export type StackCategories = {
    languages: StackItem[];
    frameworks: StackItem[];
    databases: StackItem[];
    messaging: StackItem[];
    cloud: StackItem[];
    tools: StackItem[];
};
