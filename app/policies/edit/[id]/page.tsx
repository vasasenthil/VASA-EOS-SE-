"use client"

import { useState, type ChangeEvent, useRef, useTransition, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
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
import { XIcon, FileText, AlertCircle, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react"
import {
  POLICY_DOMAINS,
  NEP_THRUST_AREAS,
  TARGET_AUDIENCES,
  REVIEW_COMMITTEES,
  type PolicyDraft,
} from "../../create/policy-form-constants"
import { submitPolicyAction, getPolicyByIdAction, type SubmitPolicyActionState } from "../../create/actions"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const initialPolicyState: PolicyDraft = {
  id: undefined,
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

export default function EditPolicyPage() {
  const router = useRouter()
  const params = useParams()
  const policyId = params.id as string

  const [policy, setPolicy] = useState<PolicyDraft>(initialPolicyState)
  const [currentKeyword, setCurrentKeyword] = useState("")
  const [activeTab, setActiveTab] = useState("basicDetails")
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [actionState, setActionState] = useState<SubmitPolicyActionState>(initialActionState)
  const [isPending, startTransition] = useTransition()

  const formRef = useRef<HTMLFormElement>(null)
  const draftPolicyDocRef = useRef<HTMLInputElement>(null)
  const annexuresRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (policyId) {
      setIsLoadingData(true)
      getPolicyByIdAction(policyId)
        .then((data) => {
          if (data) {
            setPolicy({
              ...initialPolicyState,
              ...data,
              draftPolicyDocument: data.draftPolicyDocument || null,
              annexures: data.annexures || null,
            })
          } else {
            setNotFound(true)
          }
        })
        .catch(() => setNotFound(true))
        .finally(() => setIsLoadingData(false))
    }
  }, [policyId])

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
      setPolicy((prev) => ({ ...prev, annexures: e.target.files ? e.target.files : null }))
    }
    if (actionState.errors && actionState.errors[fieldName as keyof PolicyDraft]) {
      setActionState((prev) => ({ ...prev, errors: { ...prev.errors, [fieldName]: undefined } }))
    }
  }

  const removeFile = (fieldName: "draftPolicyDocument" | "annexures", fileNameToRemove?: string) => {
    if (fieldName === "draftPolicyDocument") {
      setPolicy((prev) => ({ ...prev, draftPolicyDocument: null }))
      if (draftPolicyDocRef.current) draftPolicyDocRef.current.value = ""
    } else if (fieldName === "annexures") {
      if (fileNameToRemove && policy.annexures && Array.isArray(policy.annexures)) {
        const updatedFilesMeta = (policy.annexures as { name: string }[]).filter((f) => f.name !== fileNameToRemove)
        setPolicy((prev) => ({ ...prev, annexures: updatedFilesMeta.length > 0 ? updatedFilesMeta : null }))
      } else if (fileNameToRemove && policy.annexures instanceof FileList) {
        const updatedFiles = Array.from(policy.annexures).filter((file) => file.name !== fileNameToRemove)
        const dataTransfer = new DataTransfer()
        updatedFiles.forEach((file) => dataTransfer.items.add(file))
        setPolicy((prev) => ({ ...prev, annexures: dataTransfer.files.length > 0 ? dataTransfer.files : null }))
        if (annexuresRef.current) annexuresRef.current.files = dataTransfer.files
      } else {
        setPolicy((prev) => ({ ...prev, annexures: null }))
        if (annexuresRef.current) annexuresRef.current.value = ""
      }
    }
  }

  const handleFormSubmit = (actionType: "saveDraft" | "submitForReview") => {
    if (!formRef.current) return

    const formData = new FormData(formRef.current)
    formData.append("action", actionType)
    if (policy.id) {
      formData.append("id", policy.id)
    }

    policy.keywords.forEach((kw) => formData.append("keywords", kw))
    policy.targetAudience.forEach((ta) => formData.append("targetAudience", ta))
    policy.nepThrustAreas.forEach((nta) => formData.append("nepThrustAreas", nta))
    policy.internalReviewCommittee.forEach((irc) => formData.append("internalReviewCommittee", irc))

    formData.set("version", policy.version)
    formData.set("leadDrafter", policy.leadDrafter)

    if (
      policy.draftPolicyDocument &&
      typeof policy.draftPolicyDocument === "object" &&
      "name" in policy.draftPolicyDocument &&
      !(policy.draftPolicyDocument instanceof File)
    ) {
      formData.append("existingDraftPolicyDocumentName", (policy.draftPolicyDocument as { name: string }).name)
    }
    if (
      policy.annexures &&
      Array.isArray(policy.annexures) &&
      policy.annexures.length > 0 &&
      !(policy.annexures[0] instanceof File)
    ) {
      ;(policy.annexures as { name: string }[]).forEach((annex) => formData.append("existingAnnexureNames", annex.name))
    }

    startTransition(async () => {
      const result = await submitPolicyAction(actionState, formData)
      setActionState(result)
      if (result.success) {
        setTimeout(() => {
          setActionState(initialActionState)
          if (result.policyId) router.push(`/policies/view/${result.policyId}`)
        }, 3000)
      }
    })
  }

  if (isLoadingData) {
    return (
      <main className="container mx-auto p-8 flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="ml-4 text-lg">Loading policy data...</p>
      </main>
    )
  }

  if (notFound) {
    return (
      <main className="container mx-auto p-8 text-center min-h-screen flex flex-col justify-center items-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="mt-4 text-2xl font-bold">Policy Not Found</h1>
        <p className="mt-2 text-gray-600">The policy you are trying to edit does not exist.</p>
        <Button asChild className="mt-6">
          <Link href="/policies">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Policies List
          </Link>
        </Button>
      </main>
    )
  }

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
              <BreadcrumbLink asChild>
                <Link href={`/policies/view/${policy.id}`}>{policy.title || `Policy ${policy.id}`}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button variant="outline" asChild size="sm">
          <Link href={`/policies/view/${policy.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancel Edit
          </Link>
        </Button>
      </div>
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle as="h1" className="text-2xl font-bold text-gray-800">
            Edit National Education Policy
          </CardTitle>
          <CardDescription>
            Modify the details for Policy ID: {policy.id}. Current Version: {policy.version}
          </CardDescription>
        </CardHeader>
        <form ref={formRef} onSubmit={(e) => e.preventDefault()}>
          {policy.id && <input type="hidden" name="id" value={policy.id} />}
          <CardContent>
            {actionState.message && (
              <div
                className={`mb-4 p-3 rounded-md text-sm flex items-center gap-2 ${
                  actionState.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {actionState.success ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                <span>{actionState.message}</span>
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
                        placeholder="Add a keyword"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleKeywordAdd())}
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
                    <Label className="font-semibold">Target Audience</Label>
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
                    <Label htmlFor="version" className="font-semibold">
                      Version
                    </Label>
                    <Input
                      id="version"
                      name="version"
                      value={policy.version}
                      onChange={handleInputChange}
                      className="mt-1"
                      disabled={isPending}
                    />
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
                    <Label className="font-semibold">NEP 2020 Thrust Areas</Label>
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
                      Draft Policy Document
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="draftPolicyDocument"
                        name="draftPolicyDocument"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileChange(e, "draftPolicyDocument")}
                        className="mt-1 file:mr-4 file:py-2 file:px-4"
                        ref={draftPolicyDocRef}
                        disabled={isPending}
                      />
                      {((policy.draftPolicyDocument &&
                        typeof policy.draftPolicyDocument === "object" &&
                        "name" in policy.draftPolicyDocument) ||
                        policy.draftPolicyDocument instanceof File) && (
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
                    {policy.draftPolicyDocument &&
                      ((typeof policy.draftPolicyDocument === "object" &&
                        "name" in policy.draftPolicyDocument &&
                        !(policy.draftPolicyDocument instanceof File)) ||
                        policy.draftPolicyDocument instanceof File) && (
                        <div className="mt-2 p-2 border rounded-md bg-gray-50 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-gray-600" />
                            <span className="text-sm text-gray-700">
                              {(policy.draftPolicyDocument as File)?.name ||
                                (policy.draftPolicyDocument as { name: string })?.name}
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
                      Annexures/References
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="annexures"
                        name="annexures"
                        type="file"
                        multiple
                        onChange={(e) => handleFileChange(e, "annexures")}
                        className="mt-1 file:mr-4 file:py-2 file:px-4"
                        ref={annexuresRef}
                        disabled={isPending}
                      />
                      {policy.annexures &&
                        ((Array.isArray(policy.annexures) && policy.annexures.length > 0) ||
                          (policy.annexures instanceof FileList && policy.annexures.length > 0)) && (
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
                      (Array.isArray(policy.annexures)
                        ? policy.annexures
                        : Array.from(policy.annexures as FileList)
                      ).map((fileOrMeta, index) => (
                        <div
                          key={index}
                          className="mt-2 p-2 border rounded-md bg-gray-50 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-gray-600" />
                            <span className="text-sm text-gray-700">
                              {(fileOrMeta as File)?.name || (fileOrMeta as { name: string })?.name}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              removeFile(
                                "annexures",
                                (fileOrMeta as File)?.name || (fileOrMeta as { name: string })?.name,
                              )
                            }
                            aria-label={`Remove ${(fileOrMeta as File)?.name || (fileOrMeta as { name: string })?.name}`}
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
                    <Label className="font-semibold">Proposed Internal Review Committee</Label>
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
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/policies/view/${policy.id}`)}
              disabled={isPending}
            >
              Cancel
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
              {isPending ? "Submitting..." : "Update & Submit for Review"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
