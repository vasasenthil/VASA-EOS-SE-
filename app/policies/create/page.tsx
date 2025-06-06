"use client"

import { useState, type ChangeEvent, useRef, useTransition, useEffect } from "react"
import Link from "next/link" // Import Link
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { XIcon, FileText, AlertCircle, CheckCircle2, ListChecks } from "lucide-react" // Added ListChecks
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  POLICY_DOMAINS,
  NEP_THRUST_AREAS,
  TARGET_AUDIENCES,
  REVIEW_COMMITTEES,
  type PolicyDraft,
} from "./policy-form-constants"
import { submitPolicyAction, type SubmitPolicyActionState } from "./actions"

const initialPolicyState: PolicyDraft = {
  title: "",
  policyDomain: "",
  version: "1.0",
  abstractEN: "",
  abstractHI: "",
  keywords: [],
  targetAudience: [],
  leadDrafter: "Current User (Auto-filled)",
  nepThrustAreas: [],
  nepAlignmentJustification: "",
  draftPolicyDocument: null,
  annexures: null,
  internalReviewCommittee: [],
  status: "Draft",
}

const initialActionState: SubmitPolicyActionState = {
  message: "",
  success: false,
}

export default function CreatePolicyPage() {
  const [policy, setPolicy] = useState<PolicyDraft>(initialPolicyState)
  const [currentKeyword, setCurrentKeyword] = useState("")
  const [activeTab, setActiveTab] = useState("basicDetails")

  const [actionState, setActionState] = useState<SubmitPolicyActionState>(initialActionState)
  const [isPending, startTransition] = useTransition()

  const formRef = useRef<HTMLFormElement>(null)
  const draftPolicyDocRef = useRef<HTMLInputElement>(null)
  const annexuresRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setPolicy((prev) => ({ ...prev, [name]: value }))
    if (actionState.errors && actionState.errors[name as keyof PolicyDraft]) {
      setActionState((prev) => ({ ...prev, errors: { ...prev.errors, [name]: undefined } }))
    }
  }

  const handleSelectChange = (name: keyof PolicyDraft, value: string) => {
    setPolicy((prev) => ({ ...prev, [name]: value }))
    if (actionState.errors && actionState.errors[name as keyof PolicyDraft]) {
      setActionState((prev) => ({ ...prev, errors: { ...prev.errors, [name]: undefined } }))
    }
  }

  const handleMultiSelectChange = (name: keyof PolicyDraft, value: string) => {
    setPolicy((prev) => {
      const currentValues = (prev[name] as string[]) || []
      if (currentValues.includes(value)) {
        return { ...prev, [name]: currentValues.filter((item) => item !== value) }
      } else {
        return { ...prev, [name]: [...currentValues, value] }
      }
    })
  }

  const handleKeywordAdd = () => {
    if (currentKeyword.trim() && !policy.keywords.includes(currentKeyword.trim())) {
      setPolicy((prev) => ({ ...prev, keywords: [...prev.keywords, currentKeyword.trim()] }))
      setCurrentKeyword("")
    }
  }

  const handleKeywordRemove = (keywordToRemove: string) => {
    setPolicy((prev) => ({
      ...prev,
      keywords: policy.keywords.filter((keyword) => keyword !== keywordToRemove),
    }))
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, fieldName: "draftPolicyDocument" | "annexures") => {
    if (fieldName === "draftPolicyDocument") {
      setPolicy((prev) => ({ ...prev, draftPolicyDocument: e.target.files ? e.target.files[0] : null }))
    } else if (fieldName === "annexures") {
      setPolicy((prev) => ({ ...prev, annexures: e.target.files }))
    }
    if (actionState.errors && actionState.errors[fieldName as keyof PolicyDraft]) {
      setActionState((prev) => ({ ...prev, errors: { ...prev.errors, [fieldName]: undefined } }))
    }
  }

  const removeFile = (fieldName: "draftPolicyDocument" | "annexures", fileNameToRemove?: string) => {
    if (fieldName === "draftPolicyDocument") {
      setPolicy((prev) => ({ ...prev, draftPolicyDocument: null }))
      if (draftPolicyDocRef.current) draftPolicyDocRef.current.value = ""
    } else if (fieldName === "annexures" && policy.annexures && fileNameToRemove) {
      const currentFiles = policy.annexures instanceof FileList ? Array.from(policy.annexures) : []
      const updatedFiles = currentFiles.filter((file) => file.name !== fileNameToRemove)
      const dataTransfer = new DataTransfer()
      updatedFiles.forEach((file) => dataTransfer.items.add(file))
      setPolicy((prev) => ({ ...prev, annexures: dataTransfer.files.length > 0 ? dataTransfer.files : null }))
      if (annexuresRef.current) annexuresRef.current.files = dataTransfer.files
    } else if (fieldName === "annexures" && !fileNameToRemove) {
      setPolicy((prev) => ({ ...prev, annexures: null }))
      if (annexuresRef.current) annexuresRef.current.value = ""
    }
  }

  const handleFormSubmit = (actionType: "saveDraft" | "submitForReview") => {
    if (!formRef.current) return

    const formData = new FormData(formRef.current)
    formData.append("action", actionType)

    policy.keywords.forEach((kw) => formData.append("keywords", kw))
    policy.targetAudience.forEach((ta) => formData.append("targetAudience", ta))
    policy.nepThrustAreas.forEach((nta) => formData.append("nepThrustAreas", nta))
    policy.internalReviewCommittee.forEach((irc) => formData.append("internalReviewCommittee", irc))

    formData.set("version", policy.version)
    formData.set("leadDrafter", policy.leadDrafter)

    startTransition(async () => {
      const result = await submitPolicyAction(actionState, formData)
      setActionState(result)
      if (result.success && actionType === "submitForReview") {
        setPolicy(initialPolicyState)
        setCurrentKeyword("")
        setActiveTab("basicDetails")
        if (draftPolicyDocRef.current) draftPolicyDocRef.current.value = ""
        if (annexuresRef.current) annexuresRef.current.value = ""
        formRef.current?.reset()
      }
      if (result.success) {
        setTimeout(() => setActionState(initialActionState), 7000)
      }
    })
  }

  useEffect(() => {
    if (actionState.errors?._general) {
      setActionState((prev) => ({ ...prev, errors: { ...prev.errors, _general: undefined } }))
    }
  }, [policy, actionState.errors?._general])

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/policies">Policies</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Create New Policy</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Link href="/policies">
          <Button variant="outline" size="sm">
            <ListChecks className="mr-2 h-4 w-4" /> View All Policies
          </Button>
        </Link>
      </div>
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle as="h1" className="text-2xl font-bold text-gray-800">
            Draft New National Education Policy
          </CardTitle>
          <CardDescription>
            Fill in the details below to create a new policy draft. Version: {policy.version}
          </CardDescription>
        </CardHeader>
        <form ref={formRef} onSubmit={(e) => e.preventDefault()}>
          <CardContent>
            {actionState.message && (
              <div
                className={`mb-4 p-3 rounded-md text-sm flex items-center gap-2 ${
                  actionState.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {actionState.success ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                <span>{actionState.message}</span>
                {actionState.success && actionState.policyId && (
                  <Link
                    href={`/policies/view/${actionState.policyId}`}
                    className="ml-auto font-semibold underline hover:text-green-800"
                  >
                    View Policy
                  </Link>
                )}
              </div>
            )}
            {actionState.errors?._general && <p className="text-sm text-red-600 mt-1">{actionState.errors._general}</p>}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
                <TabsTrigger value="basicDetails">Basic Details</TabsTrigger>
                <TabsTrigger value="nepAlignment">NEP Alignment</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="consultation">Consultation</TabsTrigger>
              </TabsList>

              <TabsContent value="basicDetails">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="title" className="font-semibold">
                      Policy Title (Required)
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={policy.title}
                      onChange={handleInputChange}
                      placeholder="e.g., National Framework for Digital Education"
                      required
                      className="mt-1"
                      disabled={isPending}
                    />
                    {actionState.errors?.title && (
                      <p className="text-sm text-red-600 mt-1">{actionState.errors.title}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="policyDomain" className="font-semibold">
                      Policy Domain (Required)
                    </Label>
                    <input type="hidden" name="policyDomain" value={policy.policyDomain} />
                    <Select
                      onValueChange={(value) => handleSelectChange("policyDomain", value)}
                      value={policy.policyDomain}
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-full mt-1" id="policyDomain">
                        <SelectValue placeholder="Select a policy domain" />
                      </SelectTrigger>
                      <SelectContent>
                        {POLICY_DOMAINS.map((domain) => (
                          <SelectItem key={domain} value={domain}>
                            {domain}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {actionState.errors?.policyDomain && (
                      <p className="text-sm text-red-600 mt-1">{actionState.errors.policyDomain}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="abstractEN" className="font-semibold">
                        Abstract (English - Required)
                      </Label>
                      <Textarea
                        id="abstractEN"
                        name="abstractEN"
                        value={policy.abstractEN}
                        onChange={handleInputChange}
                        placeholder="Provide a concise summary in English..."
                        required
                        className="mt-1 min-h-[100px]"
                        disabled={isPending}
                      />
                      {actionState.errors?.abstractEN && (
                        <p className="text-sm text-red-600 mt-1">{actionState.errors.abstractEN}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="abstractHI" className="font-semibold">
                        Abstract (Hindi)
                      </Label>
                      <Textarea
                        id="abstractHI"
                        name="abstractHI"
                        value={policy.abstractHI}
                        onChange={handleInputChange}
                        placeholder="Provide a concise summary in Hindi..."
                        className="mt-1 min-h-[100px]"
                        disabled={isPending}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="keywordsInput" className="font-semibold">
                      Keywords/Tags
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="keywordsInput"
                        value={currentKeyword}
                        onChange={(e) => setCurrentKeyword(e.target.value)}
                        placeholder="Add a keyword and press Enter or Add"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleKeywordAdd()
                          }
                        }}
                        disabled={isPending}
                      />
                      <Button type="button" onClick={handleKeywordAdd} variant="outline" disabled={isPending}>
                        Add
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {policy.keywords.map((keyword) => (
                        <Badge key={keyword} variant="secondary" className="text-sm">
                          {keyword}{" "}
                          <XIcon className="ml-1 h-3 w-3 cursor-pointer" onClick={() => handleKeywordRemove(keyword)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="font-semibold">Target Audience (Select all applicable)</Label>
                    <ScrollArea className="h-40 w-full rounded-md border p-4 mt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {TARGET_AUDIENCES.map((audience) => (
                          <div key={audience} className="flex items-center space-x-2">
                            <Checkbox
                              id={`ta-${audience}`}
                              checked={policy.targetAudience.includes(audience)}
                              onCheckedChange={() => handleMultiSelectChange("targetAudience", audience)}
                              disabled={isPending}
                            />
                            <Label htmlFor={`ta-${audience}`} className="text-sm font-normal">
                              {audience}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  <div>
                    <Label htmlFor="leadDrafter" className="font-semibold">
                      Lead Drafter
                    </Label>
                    <Input
                      id="leadDrafter"
                      name="leadDrafter"
                      value={policy.leadDrafter}
                      onChange={handleInputChange}
                      className="mt-1 bg-gray-100"
                      readOnly
                      disabled={isPending}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="nepAlignment">
                <div className="space-y-6">
                  <div>
                    <Label className="font-semibold">NEP 2020 Thrust Areas (Select relevant areas)</Label>
                    <ScrollArea className="h-40 w-full rounded-md border p-4 mt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {NEP_THRUST_AREAS.map((area) => (
                          <div key={area} className="flex items-center space-x-2">
                            <Checkbox
                              id={`nep-${area}`}
                              checked={policy.nepThrustAreas.includes(area)}
                              onCheckedChange={() => handleMultiSelectChange("nepThrustAreas", area)}
                              disabled={isPending}
                            />
                            <Label htmlFor={`nep-${area}`} className="text-sm font-normal">
                              {area}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  <div>
                    <Label htmlFor="nepAlignmentJustification" className="font-semibold">
                      Justification for NEP Alignment
                    </Label>
                    <Textarea
                      id="nepAlignmentJustification"
                      name="nepAlignmentJustification"
                      value={policy.nepAlignmentJustification}
                      onChange={handleInputChange}
                      placeholder="Explain how this policy aligns with the selected NEP 2020 thrust areas..."
                      className="mt-1 min-h-[120px]"
                      disabled={isPending}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="draftPolicyDocument" className="font-semibold block mb-1">
                      Draft Policy Document (PDF, DOCX - Max 10MB)
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="draftPolicyDocument"
                        name="draftPolicyDocument"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileChange(e, "draftPolicyDocument")}
                        className="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                        ref={draftPolicyDocRef}
                        disabled={isPending}
                      />
                      {policy.draftPolicyDocument && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile("draftPolicyDocument")}
                          aria-label="Remove draft policy document"
                          disabled={isPending}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {policy.draftPolicyDocument && (
                      <div className="mt-2 p-2 border rounded-md bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-gray-600" />
                          <span className="text-sm text-gray-700">
                            {typeof policy.draftPolicyDocument === "string"
                              ? policy.draftPolicyDocument
                              : (policy.draftPolicyDocument as File).name}
                          </span>
                        </div>
                      </div>
                    )}
                    {actionState.errors?.draftPolicyDocument && (
                      <p className="text-sm text-red-600 mt-1">{actionState.errors.draftPolicyDocument}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="annexures" className="font-semibold block mb-1">
                      Annexures/References (Optional, Multiple Files)
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="annexures"
                        name="annexures"
                        type="file"
                        multiple
                        onChange={(e) => handleFileChange(e, "annexures")}
                        className="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                        ref={annexuresRef}
                        disabled={isPending}
                      />
                      {policy.annexures && policy.annexures.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile("annexures")}
                          aria-label="Remove all annexures"
                          disabled={isPending}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {policy.annexures &&
                      (policy.annexures instanceof FileList ? Array.from(policy.annexures) : []).map((file, index) => (
                        <div
                          key={index}
                          className="mt-2 p-2 border rounded-md bg-gray-50 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-gray-600" />
                            <span className="text-sm text-gray-700">{file.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile("annexures", file.name)}
                            aria-label={`Remove ${file.name}`}
                            disabled={isPending}
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="consultation">
                <div className="space-y-6">
                  <div>
                    <Label className="font-semibold">Proposed Internal Review Committee (Select one or more)</Label>
                    <ScrollArea className="h-40 w-full rounded-md border p-4 mt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {REVIEW_COMMITTEES.map((committee) => (
                          <div key={committee} className="flex items-center space-x-2">
                            <Checkbox
                              id={`irc-${committee}`}
                              checked={policy.internalReviewCommittee.includes(committee)}
                              onCheckedChange={() => handleMultiSelectChange("internalReviewCommittee", committee)}
                              disabled={isPending}
                            />
                            <Label htmlFor={`irc-${committee}`} className="text-sm font-normal">
                              {committee}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  <p className="text-sm text-gray-500">
                    Stakeholder consultation groups can be defined after internal review.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPolicy(initialPolicyState)
                setActionState(initialActionState)
                setActiveTab("basicDetails")
                if (draftPolicyDocRef.current) draftPolicyDocRef.current.value = ""
                if (annexuresRef.current) annexuresRef.current.value = ""
                formRef.current?.reset()
              }}
              disabled={isPending}
            >
              Cancel / Reset
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleFormSubmit("saveDraft")}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              type="button"
              onClick={() => handleFormSubmit("submitForReview")}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isPending}
            >
              {isPending ? "Submitting..." : "Submit for Internal Review"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
