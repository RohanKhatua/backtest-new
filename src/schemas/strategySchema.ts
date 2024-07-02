/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';

const IndicatorSchema = z.object({
    name: z.string().min(1, 'Indicator name is required and must be at least 1 character long'),
    params: z.record(z.number().safe()).optional().refine(params => !params || Object.keys(params).length > 0, 'Parameters must be a record of numbers')
        .refine(params => !params || Object.keys(params).length > 0, 'Parameters object cannot be empty')
});

const OperandSchema = z.union([
    z.object({ indicator: IndicatorSchema }),
    z.number().safe()
], {
    errorMap: () => ({ message: "Operand must be either an indicator object or a number" })
});

const OperationSchema = z.object({
    left: OperandSchema,
    right: OperandSchema,
    operator: z.string().min(1, 'Operator is required and must be at least 1 character long')
        .refine(op => ['+', '-', '*', '/', '%'].includes(op), 'Invalid operator. Must be one of: +, -, *, /, %')
});

const ConditionSchema: z.ZodType<any> = z.lazy(() =>
    z.object({
        operation: OperationSchema.optional(),
        indicator: IndicatorSchema.optional(),
        comparator: z.string().min(1, 'Comparator is required and must be at least 1 character long')
            .refine(comp => ['>', '<', '>=', '<=', '==', '!='].includes(comp), 'Invalid comparator.')
            .optional(),
        value: z.union([z.number().safe().optional(), IndicatorSchema]),
        anything: z.array(z.lazy(() => ConditionSchema)).optional(),
        everything: z.array(z.lazy(() => ConditionSchema)).optional()
    }).refine(
        data => (
            (data.operation && data.comparator && data.value) ||
            (data.indicator && data.comparator && data.value) ||
            data.anything || data.everything
        ),
        {
            message: "Invalid condition structure. Must have either (operation, comparator, and value) OR (indicator, comparator, and value) OR anything OR everything"
        }
    )
);

const AnyOrAllListSchema = z.object({
    anything: z.array(ConditionSchema).optional(),
    everything: z.array(ConditionSchema).optional()
}).refine(
    data => (data.anything && data.anything.length > 0) || (data.everything && data.everything.length > 0),
    {
        message: "Either 'anything' or 'everything' must have at least one element",
    }
).refine(
    data => !(data.anything && data.anything.length === 0),
    {
        message: "'anything' must have at least one element if it exists",
    }
).refine(
    data => !(data.everything && data.everything.length === 0),
    {
        message: "'everything' must have at least one element if it exists",
    }
);

export const StrategySchema = z.object({
    entry_conditions: AnyOrAllListSchema.optional(),
    exit_conditions: AnyOrAllListSchema.optional()
}).refine(
    data => data.entry_conditions || data.exit_conditions,
    {
        message: "At least one of 'entry_conditions' or 'exit_conditions' must be provided",
        path: ["entry_conditions"]
    }
);

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
