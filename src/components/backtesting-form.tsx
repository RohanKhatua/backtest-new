/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StrategySchema, StrategyFormType } from '../schemas/strategySchema';
import Editor from "@monaco-editor/react";
import { useState } from 'react';
import { validateStrategy } from '../utils/validation';

// Mock dictionary to replicate API data
const indicatorParams: Record<string, string[]> = {
    SMA: ['period', 'offset'],
    RSI: ['period', 'source'],
    MACD: ['fast_period', 'slow_period', 'signal_period'],
    BB: ['period', 'deviation'],
};

const indicatorOptions = Object.keys(indicatorParams);

const IndicatorForm = ({ control, watch, name, errors }: { control: any, watch: any, name: string, errors: any }) => {
    const selectedIndicator = watch(`${name}.name`) as string;
    const params = indicatorParams[selectedIndicator] || [];

    return (
        <div>
            <Controller
                name={`${name}.name`}
                control={control}
                defaultValue=""
                render={({ field }) => (
                    <div>
                        <select {...field}>
                            <option value="">Select Indicator</option>
                            {indicatorOptions.map(indicator => (
                                <option key={indicator} value={indicator}>{indicator}</option>
                            ))}
                        </select>
                        {errors?.name && <p>{errors.name.message}</p>}
                    </div>
                )}
            />
            {params.map((param, index) => (
                <Controller
                    key={index}
                    name={`${name}.params.${param}`}
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                        <div>
                            <label>{param}</label>
                            <input
                                {...field}
                                type="number"
                                placeholder={`Enter ${param}`}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                            {errors?.params?.[param] && <p>{errors.params[param].message}</p>}
                        </div>
                    )}
                />
            ))}
        </div>
    );
};

const ValueForm = ({ control, watch, name, errors }: { control: any, watch: any, name: string, errors: any }) => {
    const valueType = watch(`${name}.valueType`) || "number";

    return (
        <div>
            <Controller
                name={`${name}.valueType`}
                control={control}
                defaultValue="number"
                render={({ field }) => (
                    <div>
                        <select {...field}>
                            <option value="number">Number</option>
                            <option value="indicator">Indicator</option>
                        </select>
                        {errors?.valueType && <p>{errors.valueType.message}</p>}
                    </div>
                )}
            />

            {valueType === "number" ? (
                <Controller
                    name={`${name}.value`}
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                        <div>
                            <input type="number" {...field} placeholder="Enter Value" />
                            {errors?.value && <p>{errors.value.message}</p>}
                        </div>
                    )}
                />
            ) : (
                <IndicatorForm control={control} watch={watch} name={`${name}.value`} errors={errors?.value} />
            )}
        </div>
    );
};

interface ConditionField {
    id: string;
    type?: string;
    [key: string]: any;
}

const ConditionForm = ({ control, watch, prefix, errors }: { control: any, watch: any, prefix: string, errors: any }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `${prefix}` as const,
    });

    const handleConditionTypeChange = (index: number, value: string) => {
        // Reset all fields for the current condition
        const updatedFields = [...fields] as ConditionField[];
        updatedFields[index] = { id: updatedFields[index].id, type: value };
        remove();
        updatedFields.forEach(field => append(field));
    };

    return (
        <div>
            {fields.map((field, index) => (
                <div key={field.id} style={{ marginBottom: '10px' }}>
                    <div>
                        <label>Condition Type:</label>
                        <Controller
                            name={`${prefix}.${index}.type`}
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <div>
                                    <select
                                        {...field}
                                        onChange={(e) => {
                                            field.onChange(e);
                                            handleConditionTypeChange(index, e.target.value);
                                        }}
                                    >
                                        <option value="">Select...</option>
                                        <option value="operation">Operation</option>
                                        <option value="indicator">Indicator</option>
                                        <option value="anything">Anything</option>
                                        <option value="everything">Everything</option>
                                    </select>
                                    {errors?.[index]?.type && <p>{errors[index].type.message}</p>}
                                </div>
                            )}
                        />
                    </div>

                    {watch(`${prefix}.${index}.type`) === "operation" && (
                        <>
                            <ValueForm control={control} watch={watch} name={`${prefix}.${index}.operation.left`} errors={errors?.[index]?.operation?.left} />
                            <Controller
                                name={`${prefix}.${index}.operation.operand`}
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <div>
                                        <input {...field} placeholder="Operator" />
                                        {errors?.[index]?.operation?.operand && <p>{errors[index].operation.operand.message}</p>}
                                    </div>
                                )}
                            />
                            <ValueForm control={control} watch={watch} name={`${prefix}.${index}.operation.right`} errors={errors?.[index]?.operation?.right} />
                            <Controller
                                name={`${prefix}.${index}.comparator`}
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <div>
                                        <input {...field} placeholder="Comparator" />
                                        {errors?.[index]?.comparator && <p>{errors[index].comparator.message}</p>}
                                    </div>
                                )}
                            />
                            <ValueForm control={control} watch={watch} name={`${prefix}.${index}.value`} errors={errors?.[index]?.value} />
                        </>
                    )}

                    {watch(`${prefix}.${index}.type`) === "indicator" && (
                        <>
                            <IndicatorForm control={control} watch={watch} name={`${prefix}.${index}.indicator`} errors={errors?.[index]?.indicator} />
                            <Controller
                                name={`${prefix}.${index}.comparator`}
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <div>
                                        <input {...field} placeholder="Comparator" />
                                        {errors?.[index]?.comparator && <p>{errors[index].comparator.message}</p>}
                                    </div>
                                )}
                            />
                            <ValueForm control={control} watch={watch} name={`${prefix}.${index}.value`} errors={errors?.[index]?.value} />
                        </>
                    )}

                    {watch(`${prefix}.${index}.type`) === "anything" && (
                        <div>
                            <ConditionForm control={control} watch={watch} prefix={`${prefix}.${index}.anything`} errors={errors?.[index]?.anything} />
                            <button type="button" onClick={() => append({ type: "anything", anything: [] })}>
                                Add Condition to Anything
                            </button>
                        </div>
                    )}

                    {watch(`${prefix}.${index}.type`) === "everything" && (
                        <div>
                            <ConditionForm control={control} watch={watch} prefix={`${prefix}.${index}.everything`} errors={errors?.[index]?.everything} />
                            <button type="button" onClick={() => append({ type: "everything", everything: [] })}>
                                Add Condition to Everything
                            </button>
                        </div>
                    )}

                    <button type="button" onClick={() => remove(index)}>
                        Remove Condition
                    </button>
                </div>
            ))}

            <button type="button" onClick={() => append({ type: "" })}>
                Add Condition
            </button>
        </div>
    );
};

const BacktestingForm = () => {
    const { control, watch, getValues, formState: { errors } } = useForm<StrategyFormType>({
        resolver: zodResolver(StrategySchema),
        defaultValues: {
            entry_conditions: { anything: [] },
            exit_conditions: { anything: [] }
        }
    });

    const watchAllFields = watch();

    const [generatedJson, setGeneratedJson] = useState("");
    const [submitFeedback, setSubmitFeedback] = useState("");

    const onSubmit = () => {
        console.log('Inside onSubmit');
        const data = getValues();
        console.log('Form Data:', data);

        // Remove "type" keys from the data and restructure
        const restructureData = (conditions: any): any => {
            if (Array.isArray(conditions)) {
                return conditions.reduce((acc: any, condition: any) => {
                    if (condition.type === 'anything' || condition.type === 'everything') {
                        const key = condition.type;
                        if (!acc[key]) {
                            acc[key] = [];
                        }
                        acc[key].push(...restructureData(condition[key]));
                    } else {
                        const { type, ...rest } = condition;
                        acc.push(rest);
                    }
                    return acc;
                }, []);
            } else if (typeof conditions === 'object' && conditions !== null) {
                return Object.keys(conditions).reduce((acc: any, key) => {
                    acc[key] = restructureData(conditions[key]);
                    return acc;
                }, {});
            }
            return conditions;
        };

        const cleanedData = {
            entry_conditions: restructureData(data.entry_conditions),
            exit_conditions: restructureData(data.exit_conditions)
        };

        console.log('Cleaned Data:', cleanedData);

        const validation = validateStrategy(cleanedData);
        console.log('Validation Result:', validation);

        if (validation.valid) {
            setGeneratedJson(JSON.stringify(cleanedData, null, 2));
            setSubmitFeedback("Form submitted successfully!");
        } else {
            console.error('Validation errors:', validation.errors);
            setSubmitFeedback("Form validation failed. Check console for errors.");
        }
    };

    return (
        <div style={{ display: 'flex' }}>
            <form style={{ width: '50%' }}>
                <h2>Entry Conditions</h2>
                <ConditionForm control={control} watch={watch} prefix="entry_conditions" errors={errors.entry_conditions} />

                <h2>Exit Conditions</h2>
                <ConditionForm control={control} watch={watch} prefix="exit_conditions" errors={errors.exit_conditions} />

                <button type="button" onClick={onSubmit}>Submit</button>
            </form>
            {submitFeedback && <div>{submitFeedback}</div>}
            {watchAllFields && (
                <div>
                    <h2>Form Data</h2>
                    <pre>{JSON.stringify(watchAllFields, null, 2)}</pre>
                </div>
            )}

            <div style={{ width: '50%', padding: '0 20px' }}>
                <Editor
                    height="90vh"
                    defaultLanguage="json"
                    defaultValue=""
                    value={generatedJson}
                    options={{
                        readOnly: true,
                        minimap: { enabled: false }
                    }}
                />
            </div>
        </div>
    );
};

export default BacktestingForm;