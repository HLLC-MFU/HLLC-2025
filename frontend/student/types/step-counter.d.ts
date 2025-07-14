type StepResponse = {
    _id: string,
    user: {
        _id: string,
        name: {
            first: string,
            middle?: string,
            last?: string,
        },
        username: string,
    }
    completeStatus: boolean
    step: {
        totalStep: number,
        step: number,
        date: Date | string
    }[],
    totalStep: number,
    computedRank: number
}
type IndividualStepCounterResponse = {
    data: StepResponse[],
    metadata: {
        total: number,
        page: number,
        pageSize: number,
        scope: string,
        date?: Date | string
    },
    myRank: StepResponse
}