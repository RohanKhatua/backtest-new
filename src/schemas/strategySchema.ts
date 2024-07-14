/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';

const IndicatorSchema = z.object({
    name: z.string().min(1, 'Indicator name is required and must be at least 1 character long'),
    params: z.record(z.number().safe()).refine(params => Object.keys(params).length > 0, 'Parameters object cannot be empty')
});

// Operand can be a number or an indicator
const OperandSchema = z.union([
    z.number(),
    IndicatorSchema
]);

const OperationSchema = z.object({
    left: OperandSchema,
    right: OperandSchema,
    operator: z.string().min(1, 'Operator is required and must be at least 1 character long')
        .refine(op => ['+', '-', '*', '/', '%'].includes(op), 'Invalid operator. Must be one of: +, -, *, /, %')
});

// Condition can recursively include nested "anything" or "everything"
const ConditionSchema: z.ZodType<any> = z.lazy(() => z.object({
    operation: OperationSchema.optional(),
    indicator: IndicatorSchema.optional(),
    comparator: z.string().min(1).refine(comp => ['>', '<', '>=', '<=', '==', '!='].includes(comp), 'Invalid comparator').optional(),
    value: z.union([z.number(), IndicatorSchema]).optional(),
    anything: z.array(z.lazy(() => ConditionSchema)).optional(),
    everything: z.array(z.lazy(() => ConditionSchema)).optional()
}).refine(data => {
    // Check for complex structures (anything or everything)
    const hasComplex = data.anything || data.everything;

    // Validate conditions based on the presence of complex types
    if (hasComplex) {
        // Ensure no other keys are present when 'anything' or 'everything' is used
        const invalidKeysPresent = data.operation || data.indicator || data.comparator || data.value;
        return !invalidKeysPresent;
    } else {
        // Validate the basic condition structure
        const hasBasic = (data.operation || data.indicator) && data.comparator && data.value !== undefined;
        return hasBasic;
    }
}, {
    message: "Invalid condition structure. 'Anything' or 'Everything' types cannot have 'comparator', 'operation', 'indicator', or 'value'."
}));

// const AnyOrAllListSchema = z.object({
//     anything: z.array(ConditionSchema).optional(),
//     everything: z.array(ConditionSchema).optional()
// })
// .refine(data => {
//     // Check if at least one element exists in anything or everything
//     const hasAnything = (data.anything?.length ?? 0) > 0;
//     const hasEverything = (data.everything?.length ?? 0) > 0;
//     return hasAnything || hasEverything;
// }, {
//     message: "Either 'anything' or 'everything' must have at least one element",
// });

export const StrategySchema = z.object({
    entry_conditions: z.object({
        everything: z.array(ConditionSchema).optional(),
        anything: z.array(ConditionSchema).optional()
    }).optional(),
    exit_conditions: z.object({
        everything: z.array(ConditionSchema).optional(),
        anything: z.array(ConditionSchema).optional()
    }).optional()
}).refine(data => {
    const entryValid = (data.entry_conditions?.everything?.length ?? 0 > 0) || (data.entry_conditions?.anything?.length ?? 0 > 0);
    const exitValid = (data.exit_conditions?.everything?.length ?? 0 > 0) || (data.exit_conditions?.anything?.length ?? 0 > 0);
    return entryValid || exitValid;
}, {
    message: "At least one entry condition or one exit condition must be present"
})

export type StrategyFormType = {
    entry_conditions: {
        type: 'anything' | 'everything';
        conditions: any[];
    };
    exit_conditions: {
        type: 'anything' | 'everything';
        conditions: any[];
    };
};
