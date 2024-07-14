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
                    name={name}
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                        <div>
                            <input type="number" {...field} placeholder="Enter Value" onChange={(e) => field.onChange(Number(e.target.value))} />
                            {errors?.value && <p>{errors.value.message}</p>}
                        </div>
                    )}
                />
            ) : (
                <IndicatorForm control={control} watch={watch} name={name} errors={errors?.value} />
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
        name: `${prefix}.conditions` as const,
    });

    const handleConditionTypeChange = (index: number, value: string) => {
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
                            name={`${prefix}.conditions.${index}.type`}
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
                                    {errors?.conditions?.[index]?.type && <p>{errors.conditions[index].type.message}</p>}
                                </div>
                            )}
                        />
                    </div>

                    {watch(`${prefix}.conditions.${index}.type`) === "operation" && (
                        <>
                            <ValueForm control={control} watch={watch} name={`${prefix}.conditions.${index}.operation.left`} errors={errors?.conditions?.[index]?.operation?.left} />
                            <Controller
                                name={`${prefix}.conditions.${index}.operation.operator`}
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <div>
                                        <input {...field} placeholder="Operator" />
                                        {errors?.conditions?.[index]?.operation?.operator && <p>{errors.conditions[index].operation.operator.message}</p>}
                                    </div>
                                )}
                            />
                            <ValueForm control={control} watch={watch} name={`${prefix}.conditions.${index}.operation.right`} errors={errors?.conditions?.[index]?.operation?.right} />
                            <Controller
                                name={`${prefix}.conditions.${index}.comparator`}
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <div>
                                        <input {...field} placeholder="Comparator" />
                                        {errors?.conditions?.[index]?.comparator && <p>{errors.conditions[index].comparator.message}</p>}
                                    </div>
                                )}
                            />
                            <ValueForm control={control} watch={watch} name={`${prefix}.conditions.${index}.value`} errors={errors?.conditions?.[index]?.value} />
                        </>
                    )}

                    {watch(`${prefix}.conditions.${index}.type`) === "indicator" && (
                        <>
                            <IndicatorForm control={control} watch={watch} name={`${prefix}.conditions.${index}.indicator`} errors={errors?.conditions?.[index]?.indicator} />
                            <Controller
                                name={`${prefix}.conditions.${index}.comparator`}
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <div>
                                        <input {...field} placeholder="Comparator" />
                                        {errors?.conditions?.[index]?.comparator && <p>{errors.conditions[index].comparator.message}</p>}
                                    </div>
                                )}
                            />
                            <ValueForm control={control} watch={watch} name={`${prefix}.conditions.${index}.value`} errors={errors?.conditions?.[index]?.value} />
                        </>
                    )}

                    {watch(`${prefix}.conditions.${index}.type`) === "anything" && (
                        <div>
                            <ConditionForm control={control} watch={watch} prefix={`${prefix}.conditions.${index}.anything`} errors={errors?.conditions?.[index]?.anything} />
                            <button type="button" onClick={() => append({ type: "anything", anything: [] })}>
                                Add Condition to Anything
                            </button>
                        </div>
                    )}

                    {watch(`${prefix}.conditions.${index}.type`) === "everything" && (
                        <div>
                            <ConditionForm control={control} watch={watch} prefix={`${prefix}.conditions.${index}.everything`} errors={errors?.conditions?.[index]?.everything} />
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
            entry_conditions: { type: 'everything', conditions: [] },
            exit_conditions: { type: 'anything', conditions: [] }
        }
    });

    const watchAllFields = watch();

    const [generatedJson, setGeneratedJson] = useState("");
    const [submitFeedback, setSubmitFeedback] = useState("");

    const onSubmit = () => {
        console.log('Inside onSubmit');
        const data = getValues();
        console.log('Form Data:', data);

        const restructureData = (conditionSet:any) => {
            // Ensure that conditionSet.conditions is an array before proceeding
            if (!Array.isArray(conditionSet.conditions)) {
                console.error("Expected 'conditions' to be an array, but received:", conditionSet.conditions);
                return [];
            }

            return conditionSet.conditions.map((condition:any) => {
                // Check for nested 'anything' or 'everything' and adjust accordingly
                if (condition.type === 'anything' || condition.type === 'everything') {
                    // Make sure that the 'anything' or 'everything' itself is treated as an array
                    if (condition[condition.type] && condition[condition.type].conditions) {
                        return {
                            [condition.type]: restructureData(condition[condition.type])
                        };
                    } else {
                        console.error(`Expected '${condition.type}.conditions' to be present, but received:`, condition[condition.type]);
                        return {}; // Return an empty object or handle the case appropriately
                    }
                } else {
                    const { id, type, ...rest } = condition;
                    return Object.fromEntries(
                        Object.entries(rest).filter(([_, value]) => value !== null && value !== '')
                    );
                }
            }).filter((condition:object) => Object.keys(condition).length > 0);
        };


        const cleanData = (data: any): any => {
            if (Array.isArray(data)) {
                return data.map(cleanData).filter(item => item !== undefined && item !== null && (Array.isArray(item) ? item.length > 0 : true));
            } else if (typeof data === 'object' && data !== null) {
                const cleanedObject: any = {};
                for (const key in data) {
                    if (key !== 'valueType') { // Ensure 'valueType' is not included
                        const cleanedValue = cleanData(data[key]);
                        if (cleanedValue !== undefined) {
                            cleanedObject[key] = cleanedValue;
                        }
                    }
                }
                return Object.keys(cleanedObject).length > 0 ? cleanedObject : undefined;
            } else {
                return data;
            }
        };


        const cleanedData = cleanData({
            entry_conditions: { [data.entry_conditions.type]: restructureData(data.entry_conditions) },
            exit_conditions: { [data.exit_conditions.type]: restructureData(data.exit_conditions) }
        });

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
                <Controller
                    name="entry_conditions.type"
                    control={control}
                    defaultValue="everything"
                    render={({ field }) => (
                        <select {...field}>
                            <option value="everything">Everything</option>
                            <option value="anything">Anything</option>
                        </select>
                    )}
                />
                <ConditionForm control={control} watch={watch} prefix="entry_conditions" errors={errors.entry_conditions} />

                <h2>Exit Conditions</h2>
                <Controller
                    name="exit_conditions.type"
                    control={control}
                    defaultValue="anything"
                    render={({ field }) => (
                        <select {...field}>
                            <option value="anything">Anything</option>
                            <option value="everything">Everything</option>
                        </select>
                    )}
                />
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
