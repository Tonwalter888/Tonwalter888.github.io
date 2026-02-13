# [:::]
# start,end,go(1)or reverse(-1)
a = int(input())
b = input()
c = str(a)
if c[0] ==0:
  d= c[:-1]
else:
	d=c[:-1]+c[:0] 
e = int(d)
if b =="+":
	print (a,"+",d,"=",a+e)
elif b =="*":
	print (a,"*",d,"=",a*e)