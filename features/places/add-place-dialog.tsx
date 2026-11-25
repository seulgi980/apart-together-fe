"use client";

import * as React from "react";

import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { FormField } from "@/components/app/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { usePlaces } from "@/hooks/use-places";
import { CATEGORIES, CATEGORY_LABEL } from "@/lib/domain/labels";
import {
  isGoogleMapsUrl,
  resolvePlaceLink,
  type ResolvedPlace,
} from "@/lib/api/places";
import type { Category } from "@/lib/types";

/**
 * 장소 추가 창 (F2-1, F2-2, F2-3, F2-7, F2-8).
 * 장소 목록 위의 링크 입력 줄에 구글맵 링크를 붙여넣고 [추가]를 누르면 열린다.
 * 자동으로 채워진 장소가 맞는지 확인하고 등록만 한다 (창 안에는 링크 입력칸이 없다).
 */
export function AddPlaceDialog({
  roomId,
  open,
  onOpenChange,
  initialLink,
}: {
  roomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 목록의 링크 입력 줄에서 넘어온 링크 */
  initialLink: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <AddPlaceForm
            roomId={roomId}
            initialLink={initialLink}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type Notice = "not-google" | "duplicate" | "resolve-failed";

const NOTICE_TEXT: Record<Notice, { title: string; description: string }> = {
  "not-google": {
    title: "구글맵 링크가 아니에요",
    description: "장소는 구글맵 링크로만 등록할 수 있어요.",
  },
  duplicate: {
    title: "이미 등록된 카드예요",
    description: "이 방에 같은 장소가 이미 등록되어 있습니다.",
  },
  "resolve-failed": {
    title: "장소 정보를 불러오지 못했어요",
    description:
      "구글맵의 [공유] 버튼으로 복사한 장소 링크인지 확인하고 다시 시도해 주세요.",
  },
};

function AddPlaceForm({
  roomId,
  initialLink,
  onDone,
}: {
  roomId: string;
  initialLink: string;
  onDone: () => void;
}) {
  const { add } = usePlaces(roomId);
  const link = initialLink;
  const [resolved, setResolved] = React.useState<ResolvedPlace | null>(null);
  /** 서버가 링크를 풀고 있거나 등록 요청을 처리하는 중 */
  const [busy, setBusy] = React.useState(false);
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  // 서버가 카테고리를 추천하지 못하면 직접 고른다
  const [category, setCategory] = React.useState<Category>("etc");
  const [memo, setMemo] = React.useState("");
  const [notice, setNotice] = React.useState<Notice | null>(null);
  /** 서버가 알려준 실패 이유 (구글 키 없음, 구글에서 장소를 못 찾음 등) */
  const [failMessage, setFailMessage] = React.useState("");

  /** 서버에 링크를 보내 장소명·주소·좌표를 받아 온다 */
  const lookUp = React.useCallback(async (target: string) => {
    if (!isGoogleMapsUrl(target)) {
      setNotice("not-google");
      return;
    }
    setBusy(true);
    const found = await resolvePlaceLink(target);
    setBusy(false);
    if (!found.ok) {
      setFailMessage(found.message);
      setNotice(found.notGoogle ? "not-google" : "resolve-failed");
      return;
    }
    setResolved(found.value);
    setName(found.value.name);
    setAddress(found.value.address);
    if (found.value.category) setCategory(found.value.category);
  }, []);

  // 창이 열리자마자 링크의 장소를 불러온다
  const started = React.useRef(false);
  React.useEffect(() => {
    if (!initialLink || started.current) return;
    started.current = true;
    void lookUp(initialLink);
  }, [initialLink, lookUp]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!resolved) {
      void lookUp(link);
      return;
    }
    setBusy(true);
    const id = await add({
      placeKey: resolved.placeKey,
      name: name.trim(),
      nameEn: resolved.nameEn,
      address: address.trim(),
      addressEn: resolved.addressEn,
      area: resolved.area,
      areaEn: resolved.areaEn,
      lat: resolved.lat,
      lng: resolved.lng,
      sourceUrl: link.trim(),
      category,
      memo: memo.trim() || undefined,
    });
    setBusy(false);
    if (id === "duplicate") setNotice("duplicate");
    else if (id) onDone();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>장소 추가</DialogTitle>
        <DialogDescription>
          붙여넣은 링크의 장소가 맞는지 확인하고 등록하세요.
        </DialogDescription>
      </DialogHeader>

      {resolved && (
        <>
          <FormField
            id="place-name"
            label="장소명"
            help="자동으로 채워진 이름이 다르면 직접 고칠 수 있어요."
          >
            <Input
              id="place-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </FormField>
          <FormField id="place-address" label="주소">
            <Input
              id="place-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </FormField>
          <div className="flex flex-col gap-2">
            <Label id="place-category-label">카테고리</Label>
            <ToggleGroup
              type="single"
              variant="chip"
              aria-labelledby="place-category-label"
              className="w-full flex-wrap"
              value={category}
              onValueChange={(next) => {
                if (next) setCategory(next as Category);
              }}
            >
              {CATEGORIES.map((value) => (
                <ToggleGroupItem key={value} value={value}>
                  {CATEGORY_LABEL[value]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <FormField id="place-memo" label="한 줄 메모 (선택)">
            <Input
              id="place-memo"
              maxLength={50}
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
            />
          </FormField>
        </>
      )}

      <DialogFooter>
        <Button
          type="submit"
          disabled={busy || !link.trim() || (resolved !== null && !name.trim())}
        >
          {busy ? "처리 중…" : resolved ? "등록" : "장소 불러오기"}
        </Button>
      </DialogFooter>

      <ConfirmDialog
        open={notice !== null}
        onOpenChange={() => setNotice(null)}
        title={notice ? NOTICE_TEXT[notice].title : ""}
        description={
          notice === "resolve-failed" && failMessage
            ? failMessage
            : notice
              ? NOTICE_TEXT[notice].description
              : undefined
        }
      />
    </form>
  );
}
